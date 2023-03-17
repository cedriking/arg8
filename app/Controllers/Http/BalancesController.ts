import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, validator } from '@ioc:Adonis/Core/Validator'
import Balance from 'App/Models/Balance'
import { deepHash } from 'arbundles'
import Blockweave from 'blockweave'
import { b64UrlToBuffer, stringToBuffer } from 'blockweave/dist/utils/buffer'

export default class BalancesController {
  public async get({ request, response }: HttpContextContract) {
    let payload
    const headersSchema = schema.create({
      endpoint: schema.string.optional(),
      address: schema.string(),
      modseq: schema.string.optional(),
      price: schema.string.optional(),
      anchor: schema.string.optional(),
      timeout: schema.string.optional(),
      signature: schema.string(),
    })
    const headers = request.headers()
    const cookies = request.cookiesList()
    let authenticated = false
    try {
      payload = await validator.validate({
        schema: headersSchema,
        data: headers,
      })
      authenticated = true
    } catch (error) {}
    try {
      payload = await validator.validate({
        schema: headersSchema,
        data: cookies,
      })
      authenticated = true
    } catch (error) {}
    if (!authenticated)
      return response.status(400).send({
        error: 400,
        message: 'Invalid P3 Headers/Cookies values',
      })
    const balance = await Balance.findBy('wallet', payload.address)
    if (!balance)
      return response.status(401).send({
        error: 401,
        message: 'Unauthorized, User not found',
      })
    const dataToHash = { ...payload }
    delete dataToHash.signature

    const data = await deepHash(Object.values(dataToHash).map((d: string) => stringToBuffer(d)))
    const verify = await Blockweave.crypto.verify(
      balance.owner,
      data,
      b64UrlToBuffer(payload.signature)
    )
    if (!verify)
      return response.status(401).send({
        error: 401,
        message: 'Unauthorized, Bad signature',
      })
    return { balance: +balance.balance }
  }
}
