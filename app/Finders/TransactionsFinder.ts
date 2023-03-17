/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import Sentry from '@ioc:Adonis/Addons/Sentry'
import { Logs } from 'App/Helpers/Logs'
import { requester } from 'App/Helpers/Requester'
import {
  TransactionOffsetResponseInterface,
  TransactionResponseInterface,
  TransactionStatusResponseInterface,
} from 'App/Interfaces/TransactionResponse'
import { DRIVE_TYPE } from 'Contracts/queue'
import { Bundle } from 'arbundles'
import { getTxsMetrics } from 'App/Helpers/metrics'
import Transaction from 'App/Models/Transaction'
import { getContentType, isAns104 } from 'App/Helpers/Tags'
import { getFromCache, saveToCache } from 'App/Helpers/Cache'
import { handleDataResult, transactionToTxResponse, verifyTx } from 'App/Helpers/Transactions'
import { PassThrough } from 'stream'
import { atob, bufferToJson } from 'App/Helpers/Encoding'
import BodyReadable from 'undici/types/readable'
import { PathManifestInterface } from 'App/Interfaces/PathManifest'
import { Dispatcher } from 'undici'
import { b64UrlToBuffer } from 'blockweave/dist/utils/buffer'
import Drive from '@ioc:Adonis/Core/Drive'
import { createDriveJob, createTransactionJob } from 'App/Helpers/Queue'

const log = new Logs('TransactionsFinder')

export class TransactionsFinder {
  /**
   * Get the current status of a transaction
   * @param {string} txid - Transaction ID
   * @returns {Promise<TransactionStatusResponseInterface>} The transaction status
   */
  static async getStatus(txid: string): Promise<TransactionStatusResponseInterface | undefined> {
    const cacheTime = 1000 * 60 * 2 // 2 minutes
    // Check for a cached status
    const cached = await getFromCache(`tx:${txid}:status`, cacheTime)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {}
    }

    // Get the status from mainnet
    const { response: res } = await requester(`/tx/${txid}/status`)
    try {
      const status = (await res.body.json()) as TransactionStatusResponseInterface

      // Save to cache for 1 hour
      saveToCache(`tx:${txid}:status`, JSON.stringify(status), cacheTime).catch(() => {})
      return status
    } catch (e) {
      log.error(`Failed to get status for ${txid}`)
      Sentry.captureException(e)
    }
  }

  /**
   * Get the offset of a transaction
   * @param {string} txid - Transaction ID
   * @returns {Promise<TransactionOffsetResponseInterface>} The transaction offset
   */
  static async getOffset(txid: string): Promise<TransactionOffsetResponseInterface | undefined> {
    // Check for a cached offset
    const cacheTime = 1000 * 60 * 60 * 24 * 5 // 5 days
    const cached = await getFromCache(`tx:${txid}:offset`, cacheTime)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {}
    }

    // Get the offset from mainnet
    const { response: res } = await requester(`/tx/${txid}/offset`)
    try {
      const offset = (await res.body.json()) as TransactionOffsetResponseInterface

      // Save to cache for 5 days
      saveToCache(`tx:${txid}:offset`, JSON.stringify(offset), cacheTime).catch(() => {})
      return offset
    } catch (e) {
      log.error(`Failed to get offset for ${txid}`)
      Sentry.captureException(e)
    }
  }

  /**
   * Get the transaction content type
   * @param {string} txid - Transaction ID
   * @param {string} endpoint - The request endpoint
   * @returns {Promise<string>} The transaction content type
   */
  static async getContentData(
    txid: string,
    endpoint: string
  ): Promise<
    | {
        contentType: string
        contentLength: number
        stream?: NodeJS.ReadableStream | BodyReadable
        manifest?: PathManifestInterface
      }
    | undefined
  > {
    // Attempt to get the content type from cache
    const cacheTime = 1000 * 60 * 60 * 24 * 5 // 5 days
    const cached = await getFromCache(`tx:${txid}:contentData`, cacheTime)
    if (cached) {
      try {
        log.info(`[get-data] from cache for ${txid}`)
        const contentData = JSON.parse(cached) as {
          contentType: string
          contentLength: number
        }

        const result = await handleDataResult(
          txid,
          contentData.contentType,
          contentData.contentLength
        )
        if (result) {
          return result
        }
      } catch {}
    }

    // Get the content type from the database
    const transaction = await Transaction.query()
      .select('content_type', 'content_length')
      .where('txid', txid)
      .first()

    if (transaction && transaction.contentType) {
      // Save to cache for 1 day
      saveToCache(
        `tx:${txid}:contentData`,
        JSON.stringify({
          contentType: transaction.contentType,
          contentLength: transaction.contentLength,
        }),
        cacheTime
      ).catch(() => {})
    }

    // Get the content type from the mainnet
    // First get the tags to get the content type
    let contentType = 'application/octet-stream'
    const tx: TransactionResponseInterface | undefined = await this.getTx(txid)
    let res: Dispatcher.ResponseData | undefined
    let firstCoreGateway = false
    const useBundlrService = true

    if (tx && tx.tags && tx.tags.length) {
      const tag = tx.tags.find((tag) => tag.name === 'Q29udGVudC1UeXBl') // Content-Type
      if (tag) {
        contentType = atob(tag.value)
      }
    } else {
      // Get the content type from the mainnet
      const { response } = await requester(endpoint, { firstCoreGateway, useBundlrService })
      res = response
      contentType = response.headers['content-type'] || 'application/octet-stream'
    }

    if (contentType === 'application/x.arweave-manifest+json') {
      endpoint = `/tx/${txid}/data`
      firstCoreGateway = true
      res = undefined
    }

    if (!res) {
      const { response } = await requester(endpoint, {
        firstCoreGateway,
        useBundlrService,
      })
      res = response
    }

    // If the statusCode is an error, skip save
    if (res.statusCode >= 400) {
      // Return an error 404
      return
    }

    const contentLength = +(res.headers['content-length'] || 0)

    // Save response content types
    try {
      await Transaction.query()
        .update({
          content_type: contentType,
          content_length: contentLength,
        })
        .where('txid', txid)
    } catch {
      await createTransactionJob(txid)
    }

    saveToCache(
      `tx:${txid}:contentData`,
      JSON.stringify({
        contentType: contentType,
        contentLength: contentLength,
      }),
      cacheTime
    ).catch(() => {})
    const pipe = new PassThrough()

    res.body.pipe(pipe)

    await createDriveJob({
      id: txid,
      type: DRIVE_TYPE.STREAM,
      contentType,
      endpoint,
    })

    const result = await handleDataResult(txid, contentType, contentLength, pipe)
    if (result) {
      return result
    }
  }

  /**
   * Get the transaction field
   * @param {string} txid - Transaction ID
   * @param {string} field - The field to get
   * @returns {Promise<any>} The transaction field
   */
  static async getField(txid: string, field: string): Promise<any> {
    // Check for a cached transaction
    const cacheTime = 1000 * 60 * 60 * 24 * 5 // 5 days
    const cached = await getFromCache(`tx:${txid}`, cacheTime)
    if (cached) {
      try {
        const tmpTx: TransactionResponseInterface = JSON.parse(cached)

        if (getContentType(tmpTx.tags) === 'application/x.arweave-manifest+json')
          return this.handleManifest(tmpTx, field)
        if (tmpTx[field] === undefined || tmpTx[field] === null) {
          return
        }
        return tmpTx[field]
      } catch {}
    }

    // Check for database transaction
    const transaction = await Transaction.findBy('txid', txid)
    if (transaction) {
      const tx: TransactionResponseInterface = await transactionToTxResponse(transaction)

      // Save to cache for 1 day
      saveToCache(`tx:${txid}`, JSON.stringify(tx), cacheTime).catch(() => {})
      if (getContentType(tx.tags) === 'application/x.arweave-manifest+json')
        return this.handleManifest(tx, field)
      if (tx[field] === undefined || tx[field] === null) {
        return
      }

      return tx[field]
    }

    // Get the transaction from mainnet
    try {
      const { response: res } = await requester(`/tx/${txid}`)
      const transaction = (await res.body.json()) as TransactionResponseInterface

      // Add the transaction to the queue
      await createTransactionJob(transaction.id)

      // Save to cache for 1 day
      saveToCache(`tx:${txid}`, JSON.stringify(transaction), cacheTime).catch(() => {})

      const { response: dataRes } = await requester(`/tx/${txid}/data`, {
        firstCoreGateway: true,
        useBundlrService: true,
      })
      const data = await dataRes.body.text()
      await createDriveJob({
        id: txid,
        type: DRIVE_TYPE.BUFFER,
        contentType: getContentType(transaction.tags),
        data,
      })

      if (isAns104(transaction.tags)) await this.cacheTxsFromItems(data, transaction.id)

      if (getContentType(transaction.tags) === 'application/x.arweave-manifest+json')
        return this.handleManifest(transaction, field, data)

      if (transaction && (transaction[field] === null || transaction[field] === undefined)) {
        return
      }
      return transaction[field]
    } catch (e) {
      log.error(`Failed to get transaction for ${txid}`)
      Sentry.captureException(e)
    }
  }

  /**
   * Get the transaction details
   * @param {string} txid - Transaction ID
   * @returns {Promise<TransactionResponseInterface>} The transaction details
   */
  static async getTx(txid: string): Promise<TransactionResponseInterface | undefined> {
    // Check for a cached transaction
    const cacheTime = 1000 * 60 * 60 * 24 * 5 // 5 days
    const cached = await getFromCache(`tx:${txid}`, cacheTime)
    if (cached) {
      try {
        return await verifyTx(JSON.parse(cached))
      } catch {}
    }

    // Check for database transaction
    const transaction = await Transaction.findBy('txid', txid)

    if (transaction) {
      const tx: TransactionResponseInterface = await transactionToTxResponse(transaction)
      // Save to cache for 1 day
      saveToCache(`tx:${txid}`, JSON.stringify(tx), cacheTime).catch(() => {})

      getTxsMetrics.inc()
      return await verifyTx(tx)
    }

    // Get the transaction from mainnet
    try {
      const { response: res } = await requester(`/tx/${txid}`)
      const transaction = (await res.body.json()) as TransactionResponseInterface

      // Add the transaction to the queue
      await createTransactionJob(transaction.id)

      // Save to cache for 1 day
      saveToCache(`tx:${txid}`, JSON.stringify(transaction), cacheTime).catch(() => {})

      const { response: dataRes } = await requester(`/tx/${txid}/data`, {
        firstCoreGateway: true,
        useBundlrService: true,
      })
      const data = await dataRes.body.text()

      if (isAns104(transaction.tags)) await this.cacheTxsFromItems(data, transaction.id)

      getTxsMetrics.inc()
      return await verifyTx(transaction)
    } catch (e) {
      log.error(`Failed to get transaction for ${txid}`)
      Sentry.captureException(e)
    }
  }

  /**
   *
   * @param data
   * @param bundleId
   * @returns {Promise<void>}
   */
  static async cacheTxsFromItems(data: string, bundleId: string): Promise<void> {
    const buffer = Buffer.from(data, 'base64')
    const bundle = new Bundle(buffer)

    const items = bundle.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const id = bundle.getIdBy(i)

      const transaction = {
        id,
        bundledIn: bundleId,
        ...item.toJSON(),
      }
      saveToCache(`tx:${id}`, JSON.stringify(transaction), 60 * 60 * 24).catch(() => {})
    }
  }

  /**
   * Handle the manifest field
   * @param {TransactionResponseInterface} tx - Transaction
   * @param {string} field - field
   * @param {string} data - B64 data
   * @returns {Promise<any>} manifest
   */
  static async handleManifest(
    tx: TransactionResponseInterface,
    field: string,
    data?: string
  ): Promise<any> {
    let manifestString
    const addManifestPathTxs = async (paths) => {
      for (const path in paths) {
        const { id } = paths[path]
        await createTransactionJob(id)
      }
    }
    try {
      manifestString = (await Drive.get(tx.id))?.toString()
      if (field === 'data.json') {
        const manifest = JSON.parse(manifestString)
        addManifestPathTxs(manifest.paths)
        return manifest
      }
    } catch (error) {}
    if (!manifestString && data)
      manifestString = JSON.stringify(bufferToJson(Buffer.from(b64UrlToBuffer(data))))
    if (!manifestString && !data) {
      try {
        const { response: dataRes } = await requester(`/tx/${tx.id}/data`, {
          firstCoreGateway: true,
          useBundlrService: true,
        })
        const dataTxt = await dataRes.body.text()
        manifestString = JSON.stringify(bufferToJson(Buffer.from(b64UrlToBuffer(dataTxt))))

        await createDriveJob({
          id: tx.id,
          type: DRIVE_TYPE.BUFFER,
          contentType: 'application/x.arweave-manifest+json',
          data: dataTxt,
        })
      } catch (error) {
        log.error(`${error}`)
      }
    }
    try {
      const manifest = JSON.parse(manifestString)

      addManifestPathTxs(manifest.paths)

      if (field === 'data.json') return manifest
      return tx[field]
    } catch (error) {
      log.error(`${error}`)
    }
  }
  static async getManifestField(txid: string, field: string, response: any) {
    let manifestString
    let manifest
    try {
      manifestString = (await Drive.get(txid))?.toString()
      manifest = JSON.parse(manifestString)
    } catch (error) {}
    if (!manifestString) {
      try {
        const { response: dataRes } = await requester(`/tx/${txid}/data`, {
          firstCoreGateway: true,
          useBundlrService: true,
        })
        manifest = bufferToJson(Buffer.from(b64UrlToBuffer(await dataRes.body.text())))
        await createDriveJob({
          id: txid,
          type: DRIVE_TYPE.STREAM,
          contentType: 'application/x.arweave-manifest+json',
          endpoint: `/tx/${txid}/data`,
        })
      } catch (error) {
        log.error(`${error}`)
      }
    }

    if (!manifest?.paths[field]) return
    const tx = await this.getTx(manifest.paths[field].id)

    try {
      // @ts-ignore
      response.header('Content-type', getContentType(tx?.tags))

      const file = await Drive.get(manifest.paths[field].id)

      return file
    } catch (error) {}

    try {
      const { response: txRes } = await requester(`/tx/${manifest.paths[field].id}`, {
        firstCoreGateway: true,
        useBundlrService: true,
      })
      const transaction = (await txRes.body.json()) as TransactionResponseInterface

      const { response: dataRes } = await requester(`/tx/${manifest.paths[field].id}/data`, {
        firstCoreGateway: true,
        useBundlrService: true,
      })
      const stringData = await dataRes.body.text()

      await createDriveJob({
        id: transaction.id,
        type: DRIVE_TYPE.BUFFER,
        contentType: getContentType(transaction.tags),
        data: stringData,
      })

      response.header('Content-type', getContentType(transaction.tags))

      return Buffer.from(b64UrlToBuffer(stringData))
    } catch (error) {
      log.error(`${error}`)
    }
  }
}
