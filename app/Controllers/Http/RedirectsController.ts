import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { coreGatewayPost, requester } from 'App/Helpers/Requester'
import { Logs } from 'App/Helpers/Logs'
import { getFromCache, saveToCache } from 'App/Helpers/Cache'

const log = new Logs('RedirectsController')

export default class RedirectsController {
  public async get({ request, response }: HttpContextContract) {
    // Get the endpoint and do a request using requester
    const endpoint = request.url(true)
    log.info(`Requested redirect for ${endpoint}`)

    const cached = await getFromCache(endpoint)
    if (cached) {
      try {
        const result = JSON.parse(cached)
        if (result.error) {
          return response.status(result.error).send(result)
        }
        return result
      } catch {}
      return cached
    }

    const _resp = await requester(endpoint)
    if (!_resp?.response) {
      return response.status(404).send({
        error: 404,
        message: 'Not found',
      })
    }
    const { response: resp } = _resp

    if (resp.statusCode >= 400) {
      const toSave = {
        error: resp.statusCode,
        errorMessage: await resp.body.text(),
      }
      log.error(
        `Redirect request failed for ${endpoint} - ${toSave.error} - ${toSave.errorMessage}`
      )
      // Save to cache for 1 minutes
      await saveToCache(endpoint, JSON.stringify(toSave), 60000).catch(() => {})
      return response.status(404).send(toSave)
    }

    let res = await resp.body.text()
    try {
      res = JSON.parse(res)
      response.header('Content-Type', 'application/json')
    } catch {}

    let toSave = res
    try {
      toSave = JSON.stringify(res)
    } catch {}

    if (endpoint.startsWith('/peers')) {
      // Cache for a day
      await saveToCache(endpoint, toSave, 1000 * 60 * 60 * 24).catch(() => {})
    }

    return res
  }

  public async post({ request, response }: HttpContextContract) {
    const endpoint = request.url(true)
    log.info(`Requested redirect for ${endpoint}`)
    const body = request.body()

    const gatewayResponse = await coreGatewayPost(endpoint, body)
    const resp = gatewayResponse?.response
    if (!resp) {
      return
    }

    let res = await resp.body.text()
    try {
      res = JSON.parse(res)
      response.header('Content-Type', 'application/json')
    } catch {}

    return res
  }
}
