import { BaseCommand } from '@adonisjs/core/build/standalone'
import { Logs } from 'App/Helpers/Logs'
import { requester } from 'App/Helpers/Requester'
import Sentry from '@ioc:Adonis/Addons/Sentry'
import { diskFull } from 'App/Helpers/DiskSize'
import Rabbit from '@ioc:Adonis/Addons/Rabbit'
import { DRIVE_TYPE, QUEUE_NAMES } from 'Contracts/queue'
import Drive from '@ioc:Adonis/Core/Drive'
import { b64UrlToBuffer, bufferTob64Url } from 'blockweave/dist/utils/buffer'
import { streamToBuffer } from 'App/Helpers/Encoding'

export default class GetDrives extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'get:drives'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Saving txs data'

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
    const log = new Logs('GetDrive')

    await Rabbit.assertQueue(QUEUE_NAMES.DRIVE, {
      durable: true,
      arguments: { 'x-message-deduplication': true },
    })
    ;(await Rabbit.getChannel()).prefetch(5)

    await Rabbit.consumeFrom(QUEUE_NAMES.DRIVE, async (job) => {
      const { data, id, contentType, type, endpoint } = job.jsonContent

      try {
        if (await diskFull()) {
          job.ack()
          return
        }

        if (type === DRIVE_TYPE.STREAM) {
          //@ts-ignore
          const { response } = await requester(endpoint, {
            useBundlrService: true,
            firstCoreGateway: true,
          })
          if (!endpoint.includes('/data')) {
            await Drive.put(id, await streamToBuffer(response.body), {
              contentType,
              visibility: 'public',
            })
            job.ack()
            return
          }
          const resData = await response.body.text()

          let buffer
          if (bufferTob64Url(Buffer.from(b64UrlToBuffer(resData))) === resData)
            buffer = Buffer.from(b64UrlToBuffer(resData))
          else buffer = Buffer.from(resData)
          await Drive.put(id, buffer, {
            contentType,
            visibility: 'public',
          })
          log.success(`Data from ${id} saved!`)

          job.ack()
          return
        }

        await Drive.put(id, Buffer.from(b64UrlToBuffer(data)), {
          contentType,
          visibility: 'public',
        })
        log.success(`Data from ${id} saved!`)

        job.ack()
        return
      } catch (error) {
        log.error(`Error saving data from ${id} ${error}`)
        Sentry.captureException(error)
      }

      job.ack()
      return
    })
  }
}
