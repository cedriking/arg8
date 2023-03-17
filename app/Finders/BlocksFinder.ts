import { Logs } from 'App/Helpers/Logs'
import { requester } from 'App/Helpers/Requester'
import { getFromCache, saveToCache } from 'App/Helpers/Cache'
import BlockResponseInterface from 'App/Interfaces/BlockResponse'
import Block from 'App/Models/Block'
import { createBlockJob } from 'App/Helpers/Queue'

const log = new Logs('BlocksFinder')

export class BlocksFinder {
  /**
   * Get block by height or hash
   * @param {string} by - The key to search by
   * @param {string} value - The value to search for
   * @returns {Promise<BlockResponseInterface | undefined>}
   */
  static async get(
    by: 'height' | 'hash',
    value: number | string
  ): Promise<BlockResponseInterface | undefined> {
    // Attempt to get the block from the cache
    const cacheTime = 1000 * 60 * 60 * 24 * 5 // 5 days
    const cached = await getFromCache(`block:${by}:${value}`, cacheTime)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {}
    }

    // Attempt to get the block from the database
    let database = await Block.findBy(by, value)
    if (database) {
      let tmpBlock: BlockResponseInterface = {
        nonce: database.nonce,
        previous_block: database.previousBlock,
        timestamp: database.timestamp.toMillis() / 1000,
        last_retarget: database.lastRetarget.toMillis() / 1000,
        diff: database.diff,
        height: database.height,
        hash: database.hash,
        indep_hash: database.indepHash,
        txs: JSON.parse(database.txs),
        tx_root: '',
        tx_tree: [],
        wallet_list: database.walletList,
        reward_addr: database.rewardAddr,
        tags: [],
        reward_pool: database.rewardPool,
        weave_size: database.weaveSize,
        block_size: database.blockSize,
        cumulative_diff: database.cumulativeDiff,
        hash_list_merkle: database.hashListMerkle,
        poa: {
          option: database.poaOption.toString(),
          tx_path: database.poaTxPath,
          data_path: database.poaDataPath,
          chunk: database.poaChunk,
        },
      }

      saveToCache(`block:${by}:${value}`, JSON.stringify(tmpBlock), cacheTime).catch(() => {})
      return tmpBlock
    }

    // Attempt to get the block from other nodes
    const blockResponse = await this.getFromNodes(by, value, cacheTime)
    if (blockResponse) {
      return blockResponse
    }
  }

  static async getFromNodes(by: 'height' | 'hash', value: string | number, expTime: number) {
    const { response } = await requester(`/block/${by}/${value}`)
    log.info(`Requested block ${by} ${value} from other nodes`)

    const blockResponse = (await response.body.json()) as BlockResponseInterface

    // Add the block to the queue
    await createBlockJob(blockResponse.height)

    // Save the block to cache for 5 days
    saveToCache(`block:${by}:${value}`, JSON.stringify(blockResponse), expTime).catch(() => {})

    return blockResponse
  }
}
