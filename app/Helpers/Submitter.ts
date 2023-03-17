import Peer from 'App/Models/Peer'
import { Dispatcher, request } from 'undici'
import Sentry from '@ioc:Adonis/Addons/Sentry'
import { Logs } from './Logs'

const log = new Logs('Submitter')

/**
 * Submitter is very similar to requester, but instead of doing a get response, it does a post.
 * This deploys the transaction to the network to multiple peers.
 */

export async function submitter(
  type: 'tx' | 'chunk',
  data: any
): Promise<{ peer: string; response: Dispatcher.ResponseData }[]> {
  const peers = await Peer.query()
    .where('height', '!=', -1)
    .andWhere('allow_post_tx', true)
    .andWhere('score', '>', 0)
    .orderBy([
      { column: 'score', order: 'desc' },
      { column: 'height', order: 'desc' },
    ])
    .limit(20)

  // Shuffle the peers array
  for (let i = peers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = peers[i]
    peers[i] = peers[j]
    peers[j] = temp
  }

  let peersAndResponses: { peer: string; response: Dispatcher.ResponseData }[] = []

  let errors400 = 0

  // Attempt a request to arweave.net
  try {
    if (process.env.NODE_ENV === 'testing' && process.env.TEST === 'NEW') {
      log.info(`Trying http://localhost:1984/${type}`)
      const response = await request(`http://localhost:1984/${type}`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return [{ peer: 'localhost:1984', response }]
    }

    log.info(`Trying https://arweave.net/${type}`)
    const response = await request(`https://arweave.net/${type}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.statusCode >= 200 && response.statusCode < 300) {
      peersAndResponses.push({ peer: 'arweave.net', response })
    } else if (response.statusCode === 400) {
      const resText = await response.body.text()
      if (resText.includes('already on the weave')) {
        peersAndResponses.push({ peer: 'arweave.net', response })
        return peersAndResponses
      }
      errors400++
    }
  } catch (e) {
    log.info(`Error submitting to arweave.net: ${e}`)
    Sentry.captureException(e)
  }

  // Post the request to 3 random peers
  for (let i = 0; i < 5; i++) {
    for (const peer of peers) {
      const url = peer.url + '/' + type

      try {
        let response: Dispatcher.ResponseData
        log.info(`Trying ${url}`)
        if (type === 'chunk') {
          response = await request(url, {
            method: 'POST',
            body: JSON.stringify({
              ...data,
              data_size: data.data_size.toString(),
              offset: data.offset.toString(),
            }),
            headers: {
              'Content-Type': 'application/json',
              'arweave-data-root': data.data_root,
              'arweave-data-size': data.data_size.toString(),
            },
          })
        } else {
          response = await request(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
              'Content-Type': 'application/json',
            },
          })
        }

        if (response.statusCode >= 200 && response.statusCode < 300) {
          peersAndResponses.push({ peer: peer.url, response })

          // Remove this peer from the peers list
          peers.splice(peers.indexOf(peer), 1)
          break
        } else if (response.statusCode === 400) {
          const resText = await response.body.text()
          if (resText.includes('already on the weave')) {
            peersAndResponses.push({ peer: peer.url, response })
            return peersAndResponses
          }
          errors400++
          if (errors400 > 3) {
            return peersAndResponses
          }
        }
      } catch {}
    }
  }

  return peersAndResponses
}
