import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Logs } from 'App/Helpers/Logs'
import { submitter } from 'App/Helpers/Submitter'
import { PathManifestInterface } from 'App/Interfaces/PathManifest'
import { getTransactionSubpath } from 'App/Helpers/Transactions'
import { resolveManifestPath } from 'App/Helpers/PathManifest'
import {
  failedDataTxsMetrics,
  failedPostTxMetrics,
  failedTxsMetrics,
  getDataTxsMetrics,
  postTxMetrics,
} from 'App/Helpers/metrics'
import { TransactionsFinder } from 'App/Finders/TransactionsFinder'

const log = new Logs('TransactionsController')

export default class TransactionsController {
  public async getStatus({ params, response }: HttpContextContract) {
    const txid = params.txid
    const status = TransactionsFinder.getStatus(txid)

    return status || this.notFound(response)
  }

  public async getOffset({ params, response }: HttpContextContract) {
    const txid = params.txid
    const offset = TransactionsFinder.getOffset(txid)

    return offset || this.notFound(response)
  }

  public async getTx({ params, response }: HttpContextContract) {
    const txid = params.txid
    const transaction = await TransactionsFinder.getTx(txid)

    return transaction || this.notFound(response)
  }

  public async getField({ params, response }: HttpContextContract) {
    const { txid, field } = params

    const res = await TransactionsFinder.getField(txid, field)

    return res || this.invalidField(response)
  }

  public async getData({ response, request }: HttpContextContract) {
    const endpoint = request.url(true)
    const txid = request.params().txid

    return this.handleGetData(txid, request, response, endpoint)
  }

  public async postTx({ request, response }: HttpContextContract) {
    const tx = request.body()

    log.info(`[post-tx] posting transaction ${tx.id}`)

    const res = await submitter('tx', tx)

    if (res && res.length >= 1) {
      log.success(`[post-tx] posted transaction ${tx.id}`)

      postTxMetrics.inc()

      const status = res[0].response.statusCode
      if (status === 400) {
        const body = res[0].response.body
        return response.status(status).send(body)
      }

      return response.created({
        id: tx.id,
        error: false,
      })
    } else {
      log.error(`[post-tx] failed to post transaction ${tx.id}`)

      failedPostTxMetrics.inc()

      return response.status(400)
    }
  }
  public async getManifestField({ params, response }: HttpContextContract) {
    const { txid } = params
    const field = params['*'].join('/')

    log.info(`Getting manifest field ${field} from ${txid}`)
    const res = await TransactionsFinder.getManifestField(txid, field, response)
    return res || this.invalidField(response)
  }

  private async handleManifest(
    request: HttpContextContract['request'],
    response: HttpContextContract['response'],
    manifest: PathManifestInterface,
    txid: string
  ) {
    const subPath = getTransactionSubpath(request.url())

    if (request.url() === `/${txid}`) {
      return response.redirect(`/${txid}/`)
    }

    const resolvedTx = resolveManifestPath(manifest, subPath)

    log.info(
      `[get-data] resolved manifest path content: ${JSON.stringify({
        subPath,
        resolvedTx,
      })}`
    )

    if (resolvedTx) {
      return this.handleGetData(resolvedTx, request, response)
    }

    return this.notFound(response, true)
  }

  private async handleGetData(
    txid: string,
    request: HttpContextContract['request'],
    response: HttpContextContract['response'],
    endpoint?: string
  ) {
    if (!endpoint) {
      endpoint = `/${txid}`
    }

    // Get the file, if already saved
    log.info(`[get-data] getting data for ${txid}`)
    const contentData = await TransactionsFinder.getContentData(txid, endpoint)

    if (!contentData) {
      return this.notFound(response, true)
    }
    if (contentData.manifest) {
      log.info(`[get-data] manifest detected for ${txid}`)

      return this.handleManifest(request, response, contentData.manifest, txid)
    }

    if (contentData.stream) {
      response.header('content-type', contentData.contentType)
      response.header('content-length', contentData.contentLength)

      getDataTxsMetrics.inc()
      return response.stream(contentData.stream)
    }

    log.error(
      `[get-data] failed to get data for ${txid}. There's no manifest or stream in response.`
    )
    return this.notFound(response, true)
  }

  private async notFound(response: HttpContextContract['response'], isDataRequest = false) {
    if (isDataRequest) {
      failedDataTxsMetrics.inc()
    } else {
      failedTxsMetrics.inc()
    }

    return response.status(404).send({
      error: 404,
      message: 'Transaction not found',
    })
  }

  private async invalidField(response: HttpContextContract['response']) {
    return response.status(404).send({
      error: 404,
      message: 'Invalid field',
    })
  }
}
