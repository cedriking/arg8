import { BaseCommand } from '@adonisjs/core/build/standalone'
import { Logs } from 'App/Helpers/Logs'
import { requester } from 'App/Helpers/Requester'
import Block from 'App/Models/Block'
import Sentry from '@ioc:Adonis/Addons/Sentry'
import Transaction from 'App/Models/Transaction'
import { diskFull } from 'App/Helpers/DiskSize'
import Rabbit from '@ioc:Adonis/Addons/Rabbit'
import { QUEUE_NAMES } from 'Contracts/queue'
import { getAppName, isAns104, getContentType } from 'App/Helpers/Tags'
import { TransactionResponseInterface } from 'App/Interfaces/TransactionResponse'
import Wallet from 'App/Models/Wallet'
import { Bundle } from 'arbundles'
import Env from '@ioc:Adonis/Core/Env'
import Blockweave from 'blockweave'
import Tag from 'App/Models/Tag'
import { createBlockJob, createBundleJob } from 'App/Helpers/Queue'

export default class GetTransactions extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'get:transactions'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Saving txs'

  public static settings = {
    /**
     * Set the following value to true, if you want to load the application
     * before running the command. Don't forget to call `node ace generate:manifest`
     * afterwards.
     */
    loadApp: true,

    /**
     * Set the following value to true, if you want this command to keep running until
     * you manually decide to exit the process. Don't forget to call
     * `node ace generate:manifest` afterwards.
     */
    stayAlive: true,
  }

  public async run() {
    const log = new Logs('GetTransaction')
    await Rabbit.assertQueue(QUEUE_NAMES.TRANSACTION, {
      durable: true,
      arguments: { 'x-message-deduplication': true },
    })
    ;(await Rabbit.getChannel()).prefetch(5)

    await Rabbit.consumeFrom(QUEUE_NAMES.TRANSACTION, async (job: any) => {
      let txId = job.jsonContent.id
      let txData: TransactionResponseInterface | undefined

      log.info(`Getting transaction ${txId}`)

      try {
        if (await diskFull()) {
          job.ack()
          return
        }
        //@ts-ignore
        const { response } = await requester(`/tx/${txId}`, {
          timeout: 5000,
          firstCoreGateway: true,
        })
        txData = (await response.body.json()) as TransactionResponseInterface
      } catch (e) {
        log.error(`Error getting transaction ${txId}`)
        Sentry.captureException(e)
        job.ack()
        return
      }

      try {
        // First let's see if we should store this tx or skip it
        if (Env.get('INDEX') === 'appname') {
          const appName: string[] = Env.get('INDEX_APP_NAME', '').split('|')
          if (!appName || !appName.length || appName[0] === '') {
            log.info('INDEX_APP_NAME is not set, skipping indexing')
            job.ack()
            return
          }

          if (!txData.tags.length) {
            log.info('No tags found, skipping indexing')
            job.ack()
            return
          }

          const returnedAppName = getAppName(txData)
          if (returnedAppName === '') {
            log.info('No app name found, skipping indexing')
            job.ack()
            return
          }

          if (!appName.includes(returnedAppName)) {
            log.info(`Skipping transaction ${txId} because it is not for ${appName}`)
            job.ack()
            return
          }
        }

        // Let's create the wallet first
        const blockweave = new Blockweave(
          {
            url: 'https://arweave.net',
          },
          ['https://arweave.net']
        )
        const address = await blockweave.wallets.ownerToAddress(txData.owner)
        const wallet = await Wallet.updateOrCreate(
          { address },
          {
            address,
            owner: txData.owner,
          }
        )

        const tags: Tag[] = await Promise.all(
          txData.tags.map(async (tag) => {
            return Tag.updateOrCreate(
              { name: tag.name, value: tag.value },
              {
                name: tag.name,
                value: tag.value,
              }
            )
          })
        )

        let blockId

        try {
          //@ts-ignore
          const { response } = await requester(`/tx/${txData.id}/status`, {
            firstCoreGateway: true,
          })
          const blockHeight = (await response.body.json()).block_height
          const block = await Block.findBy('height', blockHeight)

          if (block) {
            blockId = block.id
          } else {
            log.info(`Block ${blockHeight} not found, adding it to the queue`)
            await createBlockJob(blockHeight)
          }
        } catch (e) {
          log.error(e)
        }

        const tx = await Transaction.updateOrCreate(
          { txid: txData.id },
          {
            format: txData.format,
            lastTx: txData.last_tx,
            quantity: +txData.quantity,
            data: txData.data,
            dataSize: +txData.data_size,
            dataRoot: txData.data_root,
            reward: +txData.reward,
            signature: txData.signature,
            blockId,
            walletId: wallet.id,
            target: txData.target,
            contentType: getContentType(txData.tags),
          }
        )
        log.success(`Transaction ${txId} saved`)

        await tx
          .related('tags')
          .attach(tags.map((t) => t.id))
          .catch(() => {})

        log.success(`Transaction ${txId} tags saved`)
        if (isAns104(txData.tags)) {
          log.info(`Transaction ${txId} is an ANS104 bundle`)
          //@ts-ignore
          const { response: dataRes } = await requester(`/${txData.id}`, {
            firstCoreGateway: true,
          })

          const data = await dataRes.body.arrayBuffer()
          const buffer = Buffer.from(data)
          const bundle = new Bundle(buffer)

          const items = bundle.items

          for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const id = bundle.getIdBy(i)

            const transaction = {
              id,
              bundledIn: txData.id,
              ...item.toJSON(),
            }

            const address = await blockweave.wallets.ownerToAddress(transaction.owner)
            const wallet = await Wallet.updateOrCreate(
              { address },
              {
                address,
                owner: transaction.owner,
              }
            )

            const contentType = getContentType(transaction.tags)

            createBundleJob({
              tx: {
                format: 0,
                lastTx: '',
                quantity: 0,
                data: transaction.data,
                dataSize: Buffer.from(transaction.data).length,
                dataRoot: '',
                reward: 0,
                target: transaction.target,
                signature: transaction.signature,
                blockId,
                walletId: wallet.id,
                bundledIn: transaction.bundledIn,
                contentType,
              },
              tags: transaction.tags,
              id: transaction.id,
            })
          }
        }
      } catch (e) {
        log.error(`Error processing transaction ${txData.id}: ${e}`)
        Sentry.captureException(e)
      }

      job.ack()
      return
    })
  }
}
