import { requester } from 'App/Helpers/Requester'
import { getFromCache, saveToCache } from 'App/Helpers/Cache'

export default class NetworksController {
  public async info() {
    // Check if already cached
    const cached = await getFromCache('networks:info')
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {}
    }

    const { response } = await requester('/info', { timeout: 2000 })

    const res = await response.body.json()

    const result = {
      network: 'arg8.Beta.1',
      version: '1',
      release: '1.0.0',
      height: res.height,
      current: res.current,
      blocks: res.blocks,
      peers: res.peers,
      queue_length: res.queue_length,
      node_state_latency: res.node_state_latency,
    }

    // Cache for 2 minutes
    await saveToCache('networks:info', JSON.stringify(result), 1000 * 60 * 2).catch(() => {})

    return result
  }
}
