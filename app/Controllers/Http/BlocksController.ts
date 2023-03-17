import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { BlocksFinder } from 'App/Finders/BlocksFinder'
import { Logs } from 'App/Helpers/Logs'
import { failedBlocksMetrics, getBlocksMetrics } from 'App/Helpers/metrics'
import BlockResponseInterface from 'App/Interfaces/BlockResponse'
import Env from '@ioc:Adonis/Core/Env'
import { toSha1 } from 'App/Helpers/Encoding'
import { createBlockJob } from 'App/Helpers/Queue'
import Sentry from '@ioc:Adonis/Addons/Sentry'

const log = new Logs('BlocksController')

export default class BlocksController {
  public async getByHeight({ params, response }: HttpContextContract) {
    // Attempt to get the block
    let block: BlockResponseInterface | undefined = await BlocksFinder.get('height', params.height)
    if (block) {
      getBlocksMetrics.inc()
      return block
    }

    return this.notFound(response)
  }

  public async getByIndepHash({ params, response }: HttpContextContract) {
    // Attempt to get the block
    log.info(`Requested block indep_hash ${params.hash}`)
    const block = await BlocksFinder.get('hash', params.hash)
    if (block) {
      getBlocksMetrics.inc()
      return block
    }

    return this.notFound(response)
  }

  private async notFound(response: HttpContextContract['response']) {
    failedBlocksMetrics.inc()

    return response.status(404).send({
      error: 404,
      message: 'Block not found',
    })
  }

  public async addToQueue({ params, response }: HttpContextContract) {
    if (!params.key || params.key !== toSha1(Env.get('APP_KEY'))) {
      return response.redirect('/')
    }

    const height = +params.height

    await createBlockJob(height)

    return response.created({
      id: height,
      error: false,
    })
  }
}
