import { BaseCommand } from '@adonisjs/core/build/standalone'
import { Logs } from 'App/Helpers/Logs'
import BlockResponseInterface from 'App/Interfaces/BlockResponse'

import { DateTime } from 'luxon'
// import { diskFull } from 'App/Helpers/DiskSize'
import Rabbit from '@ioc:Adonis/Addons/Rabbit'
import { QUEUE_NAMES } from 'Contracts/queue'

import { TransactionResponseInterface } from 'App/Interfaces/TransactionResponse'

import Blockweave from 'blockweave'

import { request } from 'undici'
import InfoResponseInterface from 'App/Interfaces/InfoResponse'
import { getFromCache } from 'App/Helpers/Cache'
import Peer from 'App/Models/Peer'

export default class GetPeers extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'get:peers'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Saving peers'

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
    const log = new Logs('UpdatePeer')

    await Rabbit.assertQueue(QUEUE_NAMES.PEER, {
      durable: true,
      arguments: { 'x-message-deduplication': true },
    })

    await Rabbit.consumeFrom(QUEUE_NAMES.PEER, async (job) => {
      let peer
      try {
        peer = (await Peer.find(job.jsonContent.id)) as Peer
        log.info(`Updating peer ${peer.url}`)
      } catch (error) {
        log.error(`Error Getting Peer`)
        job.ack()
        return
      }

      try {
        // Ignore disk full for peers
        // if (await diskFull()) {
        //   job.ack()
        //   return
        // }
        // Calculate the response time of the request
        const start = Date.now()
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), 2000)
        const res = await request(`${peer.url}/info`, {
          signal: controller.signal,
        })
        clearTimeout(id)
        const end = Date.now()

        if (res.statusCode < 200 || res.statusCode >= 300) {
          log.error(`Peer ${peer.url} returned ${res.statusCode}`)
          job.ack()
          return
        }

        const response = (await res.body.json()) as InfoResponseInterface

        peer.height = response.height
        peer.loadTime = end - start

        peer.lastSeen = DateTime.now()
      } catch {
        log.error(`Failed to update peer ${peer.url}, removing it from the list`)
        job.ack()
        try {
          await peer.delete()
        } catch (error) {
          console.log(error)
        }
        return
      }

      if (peer.height > -1) {
        if (peer.loadTime < 100) {
          peer.score += 3
        } else if (peer.loadTime < 300) {
          peer.score += 2
        } else {
          peer.score += 1
        }

        // Check if the peer accept transactions (POST)
        try {
          const blockweave = new Blockweave(
            {
              url: peer.url,
            },
            [peer.url]
          )

          const tx = await blockweave.createTransaction(
            {
              data: 'This is a test transaction',
            },
            await blockweave.wallets.generate()
          )

          const res = await tx.signAndPost()
          if (res.status === 200) {
            peer.allowPostTx = true
            peer.allowPostChunk = true
            peer.score += 3
          } else {
            peer.allowPostTx = false
            peer.allowPostChunk = false
            peer.score -= 1
            if (peer.score < 0) {
              peer.score = 0
            }
            log.error(
              `Peer ${peer.url} does not accept POST transactions, status code: ${res.status}`
            )
          }
        } catch (err) {
          log.info(`Peer ${peer.url} does not accept transactions`)
          peer.score -= 1
          peer.allowPostChunk = false
          peer.allowPostChunk = false
        }
      }

      // Attempt to get a random block
      let height: number = +((await getFromCache('FillBlockHeight')) || -1)

      if (height > -1) {
        const randomBlock = Math.floor(Math.random() * height) + 1

        let blockData: BlockResponseInterface | undefined

        try {
          const controller = new AbortController()
          const id = setTimeout(() => controller.abort(), 10000)
          const res = await request(`${peer.url}/block/height/${randomBlock}`, {
            signal: controller.signal,
          })
          clearTimeout(id)

          if (res.statusCode >= 200 && res.statusCode < 300) {
            peer.score += 1
            blockData = await res.body.json()
          } else {
            peer.score -= 1
          }
        } catch (e) { }

        // Attempt to get a transaction
        if (blockData) {
          const randomTx = Math.floor(Math.random() * blockData.txs.length)

          let txData: TransactionResponseInterface | undefined
          try {
            const controller = new AbortController()
            const id = setTimeout(() => controller.abort(), 10000)
            const res = await request(`${peer.url}/tx/${randomTx}`, {
              signal: controller.signal,
            })
            clearTimeout(id)

            if (res.statusCode >= 200 && res.statusCode < 300) {
              peer.score += 1
              txData = await res.body.json()
            } else {
              peer.score -= 1
            }
          } catch (e) { }

          if (txData && +txData.data_size > 0) {
            // Check if the tx has data, if it does, attempt to get the data
            try {
              const controller = new AbortController()
              const id = setTimeout(() => controller.abort(), 10000)
              const result = await request(`${peer.url}/${randomTx}`, {
                signal: controller.signal,
              })
              clearTimeout(id)

              if (result.statusCode >= 200 && result.statusCode < 300) {
                peer.score += 3
              } else {
                peer.score -= 1
              }
            } catch (e) { }
          }
        }
      }

      if (peer.score < 0) {
        peer.score = 0
      }

      try {
        await peer.save()
      } catch (error) {
        console.log(error)
      }
      log.success(`Done updating peer ${peer.url}`)

      job.ack()
      return
    })
  }
}
