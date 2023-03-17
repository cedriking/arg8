import { BaseCommand } from '@adonisjs/core/build/standalone'
import { Logs } from 'App/Helpers/Logs'
import Sentry from '@ioc:Adonis/Addons/Sentry'
import Transaction from 'App/Models/Transaction'
import { createDriveJob } from 'App/Helpers/Queue'
import { diskFull } from 'App/Helpers/DiskSize'
import Rabbit from '@ioc:Adonis/Addons/Rabbit'
import { DRIVE_TYPE, QUEUE_NAMES } from 'Contracts/queue'
import Tag from 'App/Models/Tag'

export default class GetBundlrs extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'get:bundlrs'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Extracting and Saving Bundlrs'

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
    const log = new Logs('GetBundlr')

    await Rabbit.assertQueue(QUEUE_NAMES.BUNDLR, {
      durable: true,
      arguments: { 'x-message-deduplication': true },
    })
    ;(await Rabbit.getChannel()).prefetch(5)

    await Rabbit.consumeFrom(QUEUE_NAMES.BUNDLR, async (job: any) => {
      try {
        const bundlr = job.jsonContent.tx
        const id = job.jsonContent.id
        const txTags: Tag[] = job.jsonContent.tags

        log.info(`bundlr transaction ${id}`)
        if (await diskFull()) {
          job.ack()
          return
        }
        const tx = await Transaction.updateOrCreate({ txid: id }, bundlr)
        log.success(`bundlr ${id} saved`)

        const tags: Tag[] = await Promise.all(
          txTags.map(async (tag) => {
            return Tag.updateOrCreate(
              { name: tag.name, value: tag.value },
              {
                name: tag.name,
                value: tag.value,
              }
            )
          })
        )

        await tx
          .related('tags')
          .attach(tags.map((t) => t.id))
          .catch(console.error)
        log.success(`bundlr ${id} tags saved`)

        await createDriveJob({
          id,
          data: bundlr.data,
          contentType: bundlr.contentType,
          type: DRIVE_TYPE.BUFFER,
        })

        job.ack()
        return
      } catch (error) {
        log.error(`Error processing Bundlr ${error}`)
        Sentry.captureException(error)
        job.ack()
        return
      }

      job.ack()
      return
    })
  }
}
