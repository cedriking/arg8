import Sentry from '@ioc:Adonis/Addons/Sentry'
import Peer from 'App/Models/Peer'
import Blockweave from 'blockweave'
import { bufferTob64Url, stringToBuffer } from 'blockweave/dist/utils/buffer'
import { Dispatcher, request } from 'undici'
import { Logs } from './Logs'
import Env from '@ioc:Adonis/Core/Env'
import { readFileSync } from 'fs'
import { JWKInterface } from 'arbundles/src/interface-jwk'

const log = new Logs('Requester')
const address = Env.get('MY_WALLET_ADDRESS')
const rawWallet = readFileSync(Env.get('MY_WALLET_FILE'), 'utf-8')
const wallet = JSON.parse(rawWallet) as JWKInterface

/**
 * Requester allows us to easily request data from multiple peers. If one fails, we keep trying others.
 */

export async function requester(
  endpoint: string,
  options: { timeout?: number; firstCoreGateway?: boolean; useBundlrService?: boolean } = {
    timeout: 20000,
    firstCoreGateway: false,
    useBundlrService: false,
  }
): Promise<{ peer: string; response: Dispatcher.ResponseData } | undefined> {
  const { timeout, firstCoreGateway, useBundlrService } = options

  if (!endpoint.startsWith('/')) {
    endpoint = `/${endpoint}`
  }

  if (process.env.NODE_ENV === 'testing' && process.env.TEST === 'NEW') return arlocalCall(endpoint)

  let success = false

  let netResponse: { peer: string; response: Dispatcher.ResponseData } | undefined

  if (useBundlrService) {
    netResponse = await bundlrCall(endpoint)
    const response = netResponse?.response
    // If not a 2xx, we keep trying
    if (response && isResponseValid(response)) {
      success = true
    }
  }

  if (firstCoreGateway && !success) {
    netResponse = await coreGatewayCall(endpoint)
    const response = netResponse?.response
    // If not a 2xx, we keep trying
    if (response && isResponseValid(response)) {
      success = true
    }
  }
  if (!success) {
    netResponse = await p3PeersCall(endpoint, timeout)
    const response = netResponse?.response
    if (response && isResponseValid(response)) {
      success = true
    }
  }

  if (!success) {
    netResponse = await peersCall(endpoint, timeout)
    const response = netResponse?.response
    if (response && isResponseValid(response)) {
      success = true
    }
  }

  if (!success && !firstCoreGateway) {
    // Try directly with arweave.net
    netResponse = await coreGatewayCall(endpoint)
    const response = netResponse?.response
    // If not a 2xx, we keep trying
    if (response && isResponseValid(response)) {
      success = true
    }
  }

  if (netResponse) {
    return netResponse
  }
}

async function coreGatewayCall(
  endpoint: string
): Promise<{ peer: string; response: Dispatcher.ResponseData } | undefined> {
  let netResponse: { peer: string; response: Dispatcher.ResponseData } | undefined =
    await doRequest('https://arweave.net', endpoint)
  const response = netResponse?.response
  if (response && logResponse(`https://arweave.net${endpoint}`, response)) {
    return netResponse
  }
}

export async function bundlrCall(
  endpoint: string
): Promise<{ peer: string; response: Dispatcher.ResponseData } | undefined> {
  const endpointMatchRegex = /^\/([a-zA-Z0-9-_]{43})$/i
  if (endpointMatchRegex.test(endpoint)) {
    endpoint = endpoint.replace(endpointMatchRegex, '/tx/$1/data')
  }

  let netResponse: { peer: string; response: Dispatcher.ResponseData } | undefined =
    await doRequest('https://node1.bundlr.network', endpoint)
  let response = netResponse?.response
  if (response && logResponse(`https://node1.bundlr.network${endpoint}`, response)) {
    return netResponse
  }

  // If node1 failed, attempt request on node2
  netResponse = await doRequest('https://node2.bundlr.network', endpoint)
  response = netResponse?.response
  if (response && logResponse(`https://node2.bundlr.network${endpoint}`, response)) {
    return netResponse
  }
}

export async function coreGatewayPost(endpoint: string, body: Record<string, any>) {
  let netResponse: { peer: string; response: Dispatcher.ResponseData } | undefined

  log.info(`Trying https://arweave-search.goldsky.com${endpoint}`)
  try {
    const response = await request(`https://arweave-search.goldsky.com${endpoint}`, {
      method: 'POST',
      maxRedirections: 2,
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
      },
    })

    netResponse = {
      peer: 'https://arweave-search.goldsky.com',
      response,
    }
  } catch (e) {
    log.error(`https://arweave.net${endpoint} failed: ${e}`)
    Sentry.captureException(e)
  }
  if (netResponse) {
    return netResponse
  }

  log.info(`Trying https://arweave.net${endpoint}`)

  try {
    const response = await request(`https://arweave.net${endpoint}`, {
      method: 'POST',
      maxRedirections: 2,
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
      },
    })

    netResponse = {
      peer: 'https://arweave.net',
      response,
    }
  } catch (e) {
    log.error(`https://arweave.net${endpoint} failed: ${e}`)
    Sentry.captureException(e)
  }
  return netResponse
}

export async function peersCall(
  endpoint: string,
  timeout: number = 20000
): Promise<{ peer: string; response: Dispatcher.ResponseData } | undefined> {
  try {
    let errors400: number = 0
    let netResponse: { peer: string; response: Dispatcher.ResponseData } | undefined

    const endpointMatchRegex = /^\/tx\/[a-z0-9-_]{43}\/data[\.\w]*/i
    if (endpointMatchRegex.test(endpoint)) {
      // replace endpoint
      endpoint = endpoint.replace(/^\/tx\//, '')
      const txid = endpoint.split('/')[0]
      endpoint = `/${txid}`
    }

    const peers = await Peer.query()
      .where('height', '!=', -1)
      .andWhere('score', '>', 0)
      .orderBy([
        { column: 'score', order: 'desc' },
        { column: 'height', order: 'desc' },
      ])
      .limit(20)

    if (!peers.length) {
      throw new Error('No peers available')
    }

    // Shuffle the peers array
    for (let i = peers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = peers[i]
      peers[i] = peers[j]
      peers[j] = temp
    }

    for (const peer of peers) {
      const url = peer.url

      netResponse = await doRequest(url, endpoint, timeout)
      const response = netResponse?.response
      if (response?.headers['content-length'] === '0') continue
      if (response && logResponse(`${url}${endpoint}`, response)) {
        // If not a 2xx, we keep trying
        break
      } else if (response && response.statusCode === 400) {
        errors400++
        if (errors400 >= 3) {
          break
        }
      }
    }
    return netResponse
  } catch (error) {}
}
export async function p3PeersCall(
  endpoint: string,
  timeout: number = 20000
): Promise<{ peer: string; response: Dispatcher.ResponseData } | undefined> {
  try {
    let errors400: number = 0
    let netResponse: { peer: string; response: Dispatcher.ResponseData } | undefined

    const endpointMatchRegex = /^\/tx\/[a-z0-9-_]{43}\/data[\.\w]*/i
    if (endpointMatchRegex.test(endpoint)) {
      // replace endpoint
      endpoint = endpoint.replace(/^\/tx\//, '')
      const txid = endpoint.split('/')[0]
      endpoint = `/${txid}`
    }

    const peers = await Peer.query()
      .andWhere('p3_compatible', '=', true)
      .orderBy([
        { column: 'score', order: 'desc' },
        { column: 'height', order: 'desc' },
      ])
      .limit(20)

    if (!peers.length) {
      throw new Error('No peers available')
    }

    // Shuffle the peers array
    for (let i = peers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = peers[i]
      peers[i] = peers[j]
      peers[j] = temp
    }

    for (const peer of peers) {
      const url = peer.url

      netResponse = await doP3Request(url, endpoint, timeout)
      const response = netResponse?.response
      // If not a 2xx, we keep trying
      if (response && logResponse(`${url}${endpoint}`, response)) {
        break
      } else if (response && response.statusCode === 400) {
        errors400++
        if (errors400 >= 3) {
          break
        }
      }
    }
    return netResponse
  } catch (error) {}
}
async function doRequest(
  url: string,
  endpoint: string,
  timeout: number = 20000
): Promise<{ peer: string; response: Dispatcher.ResponseData } | undefined> {
  log.info(`Trying ${url}${endpoint}`)

  let netResponse: { peer: string; response: Dispatcher.ResponseData } | undefined

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort, timeout)
    const response = await request(url + endpoint, {
      signal: controller.signal,
      maxRedirections: 2,
    })

    clearTimeout(id)
    netResponse = {
      peer: url,
      response,
    }
  } catch (e) {
    log.error(`${url} failed: ${e}`)
    Sentry.captureException(e)
  }

  return netResponse
}

async function doP3Request(
  url: string,
  endpoint: string,
  timeout: number = 2000
): Promise<{ peer: string; response: Dispatcher.ResponseData } | undefined> {
  log.info(`Trying ${url}${endpoint}`)

  let netResponse: { peer: string; response: Dispatcher.ResponseData } | undefined

  try {
    const controller = new AbortController()
    const rawSignature = await Blockweave.crypto.sign(wallet, stringToBuffer(address))
    const signature = bufferTob64Url(rawSignature)
    const headers = {
      address,
      signature,
    }
    const id = setTimeout(() => controller.abort, timeout)
    const response = await request(url + endpoint, {
      signal: controller.signal,
      maxRedirections: 2,
      headers,
    })

    clearTimeout(id)
    netResponse = {
      peer: url,
      response,
    }
  } catch (e) {
    log.error(`${url} failed: ${e}`)
    Sentry.captureException(e)
  }

  return netResponse
}

function logResponse(uri: string, response: Dispatcher.ResponseData): boolean {
  if (isResponseValid(response)) {
    log.success(
      `${uri} returned ${response.headers['content-type']} - ${response.headers['content-length']}`
    )
    return true
  } else {
    log.error(`${uri} returned ${response.statusCode} - ${response.headers['content-length']}`)
    return false
  }
}

function isResponseValid(response: Dispatcher.ResponseData): boolean {
  return response.statusCode >= 200 && response.statusCode < 300
}

async function arlocalCall(
  endpoint: string
): Promise<{ peer: string; response: Dispatcher.ResponseData } | undefined> {
  let netResponse: { peer: string; response: Dispatcher.ResponseData } | undefined =
    await doRequest('http://localhost:1984', endpoint)
  const response = netResponse?.response
  if (response && logResponse(`http://localhost:1984${endpoint}`, response)) {
    return netResponse
  }
}
