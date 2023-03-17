import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, validator } from '@ioc:Adonis/Core/Validator'
import Balance from 'App/Models/Balance'
import Blockweave from 'blockweave'
import { b64UrlToBuffer } from 'blockweave/dist/utils/buffer'

export default class GraphqlController {
  public async serve({ request, response, view }: HttpContextContract) {
    let payload
    const headersSchema = schema.create({
      address: schema.string(),
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
    const verify = await Blockweave.crypto.verify(
      balance.owner,
      payload.address,
      b64UrlToBuffer(payload.signature)
    )
    if (!verify)
      return response.status(401).send({
        error: 401,
        message: 'Unauthorized, Bad signature',
      })

    return view.render('graphql', {
      headers: {
        address: payload.address,
        signature: payload.signature,
      },
    })
  }
}
