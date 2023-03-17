import { TransactionResponseInterface } from 'App/Interfaces/TransactionResponse'
import Transaction from 'App/Models/Transaction'
import Wallet from 'App/Models/Wallet'
import Drive from '@ioc:Adonis/Core/Drive'
import Sentry from '@ioc:Adonis/Addons/Sentry'
import { bufferToJson, streamToBuffer } from 'App/Helpers/Encoding'
import { b64UrlToBuffer } from 'blockweave/dist/utils/buffer'
import Arweave from 'arweave'
import ArweaveTransaction from 'arweave/node/lib/transaction'

const arweave = Arweave.init({})

export const getTransactionSubpath = (requestPath: string): string | undefined => {
  const subpath = requestPath.match(/^\/?[a-zA-Z0-9-_]{43}\/(.*)$/i)
  return (subpath && subpath[1]) || undefined
}

export const transactionToTxResponse = async (
  transaction: Transaction
): Promise<TransactionResponseInterface> => {
  const tags = (await transaction?.related('tags').query()) || []

  const tx: TransactionResponseInterface = {
    id: transaction.txid,
    format: transaction.format,
    last_tx: transaction.lastTx,
    owner: (await Wallet.find(transaction.walletId))?.owner || '',
    tags: tags.map((tag) => {
      return {
        name: tag.name,
        value: tag.value,
      }
    }),
    target: transaction.target,
    quantity: transaction.quantity.toString(),
    data: transaction.data,
    data_size: transaction.dataSize.toString(),
    data_tree: [],
    data_root: transaction.dataRoot,
    reward: transaction.reward.toString(),
    signature: transaction.signature,
  }

  if (transaction.bundledIn) {
    tx.bundled_in = transaction.bundledIn
  }

  return tx
}

/**
 * Get the stored data for a transaction
 * @param {string} txid - Transaction ID
 * @returns {Promise<NodeJS.ReadableStream>} The transaction data
 */
export const getDriveData = async (txid: string): Promise<NodeJS.ReadableStream | undefined> => {
  const stats = await Drive.getStats(txid)
  if (stats && stats.size > 0) {
    try {
      return await Drive.getStream(txid)
    } catch (e) {
      console.log(e)
      Sentry.captureException(e)
    }
  }
}

export const handleDataResult = async (
  txid: string,
  contentType: string,
  contentLength: number,
  stream?: any
) => {
  if (contentType === 'application/x.arweave-manifest+json') {
    try {
      let manifest
      if (stream) {
        try {
          manifest = bufferToJson(
            Buffer.from(b64UrlToBuffer(await (await streamToBuffer(stream)).toString('utf-8')))
          )
        } catch (error) {
          console.error(error)
        }
      }
      if (!manifest) {
        const data = await Drive.get(txid)
        manifest = JSON.parse(data.toString())
      }

      return {
        contentType: contentType,
        contentLength: contentLength,
        manifest,
      }
    } catch (e) {
      console.error(e)
      Sentry.captureException(e)
    }
  }

  if (!stream) {
    try {
      stream = await getDriveData(txid)
    } catch {}
  }

  if (stream) {
    return {
      contentType: contentType,
      contentLength: contentLength,
      stream,
    }
  }
}

export const verifyTx = async (tx: TransactionResponseInterface) => {
  const $tx = new ArweaveTransaction(tx as any)
  const valid = await arweave.transactions.verify($tx)
  return valid ? $tx.toJSON() : undefined
}
