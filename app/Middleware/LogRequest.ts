import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Logs } from 'App/Helpers/Logs'

export default class LogRequest {
  private log = new Logs('LogRequest')

  public async handle({ request }: HttpContextContract, next: () => Promise<void>) {
    this.log.info(`[${request.ip()}] -> ${request.method()}: ${request.url()}`)
    await next()
  }
}
