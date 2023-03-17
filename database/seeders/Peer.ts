import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Peer from 'App/Models/Peer'
import { existsSync, readFileSync } from 'fs'
import { DateTime } from 'luxon'

export default class PeerSeeder extends BaseSeeder {
  public async run() {
    if (!existsSync('./peers.txt')) {
      console.error('Please provide a file called peers.txt on root. Skipping for now!')
      return
    }

    const peers = Array.from(new Set(readFileSync('./peers.txt', 'utf8').split('\n'))).map(
      (seed: string) => {
        return {
          url: seed.trim(),
          height: -1,
          loadTime: 999999999,
          lastSeen: DateTime.fromMillis(0),
        }
      }
    )

    if (!existsSync('./p3_peers.txt')) {
      console.error('Please provide a file called p3_peers.txt on root. Skipping for now!')
      return
    }
    peers.push(
      ...Array.from(new Set(readFileSync('./p3_peers.txt', 'utf8').split('\n')))
        .map((seed: string) => {
          return {
            url: seed.trim(),
            height: -1,
            loadTime: 999999999,
            p3Compatible: true,
            lastSeen: DateTime.fromMillis(0),
          }
        })
        .filter(({ url }) => !!url)
    )
    await Peer.query().delete()
    await Peer.createMany(peers)
  }
}
