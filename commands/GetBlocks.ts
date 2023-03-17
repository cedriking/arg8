import { BaseCommand } from '@adonisjs/core/build/standalone'
import { Logs } from 'App/Helpers/Logs'
import { requester } from 'App/Helpers/Requester'
import BlockResponseInterface from 'App/Interfaces/BlockResponse'
import Block from 'App/Models/Block'
import { DateTime } from 'luxon'
import Sentry from '@ioc:Adonis/Addons/Sentry'
import Transaction from 'App/Models/Transaction'
import { createTransactionJob } from 'App/Helpers/Queue'
import { diskFull } from 'App/Helpers/DiskSize'
import Rabbit from '@ioc:Adonis/Addons/Rabbit'
import { QUEUE_NAMES } from 'Contracts/queue'

export default class GetBlocks extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'get:blocks'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Saving blocks'

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
    const log = new Logs('GetBlock')
    await Rabbit.assertQueue(QUEUE_NAMES.BLOCK, {
      durable: true,
      arguments: { 'x-message-deduplication': true },
    })

    await Rabbit.consumeFrom(QUEUE_NAMES.BLOCK, async (job: any) => {
      const blockId: number = job.jsonContent.id

      log.info(`Getting block ${blockId}`)
      if (await diskFull()) {
        job.ack()
        return
      }

      let blockData: BlockResponseInterface | undefined

      try {
        //@ts-ignore
        const { response } = await requester(`/block/height/${blockId}`, { firstCoreGateway: true })
        blockData = (await response.body.json()) as BlockResponseInterface
      } catch (e) {
        log.error(`Error getting block ${blockId}`)
        Sentry.captureException(e)
        job.ack()
        return
      }

      try {
        // Let's save the block
        const block = await Block.updateOrCreate(
          {
            indepHash: blockData.indep_hash,
          },
          {
            nonce: blockData.nonce,
            previousBlock: blockData.previous_block,
            timestamp: DateTime.fromMillis(blockData.timestamp * 1000),
            lastRetarget: DateTime.fromMillis(blockData.last_retarget * 1000),
            diff: blockData.diff.toString(),
            height: blockData.height,
            hash: blockData.hash,
            txs: JSON.stringify(blockData.txs),
            indepHash: blockData.indep_hash,
            walletList: blockData.wallet_list,
            rewardAddr: blockData.reward_addr,
            rewardPool: blockData.reward_pool,
            weaveSize: blockData.weave_size,
            blockSize: blockData.block_size,
            cumulativeDiff: blockData.cumulative_diff,
            hashListMerkle: blockData.hash_list_merkle,
            poaOption: +blockData.poa.option,
            poaTxPath: blockData.poa.tx_path,
            poaDataPath: blockData.poa.data_path,
            poaChunk: blockData.poa.chunk,
          }
        )

        if (blockData.txs.length) {
          // Let's check which transactions are in the database, and update the block id, if missing, add them to the queue
          const txs = await Transaction.query().whereIn('txid', blockData.txs)

          for (const tx of blockData.txs) {
            const txInDb = txs.find((t) => t.txid === tx)

            if (!txInDb) {
              try {
                await createTransactionJob(tx)
              } catch (e) {
                log.error(`Error adding transaction ${tx} to the queue: ${e.message}`)
                Sentry.captureException(e)
              }
            } else {
              txInDb.blockId = block.id
              await txInDb.save()
            }
          }
        }

        log.success(`Block ${blockId} saved`)
      } catch (e) {
        log.error(`Error saving block ${blockId}`)
        Sentry.captureException(e)
      }

      job.ack()
      return
    })
  }
}
