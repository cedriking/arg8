import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class DenyMethod {
  public async handle({ request, response }: HttpContextContract, next: () => Promise<void>) {
    const method = request.method()
    if (method === 'HEAD')
      return response.status(405).send({
        error: 405,
        message: `Method ${method} not allowed`,
      })
    await next()
  }
}
