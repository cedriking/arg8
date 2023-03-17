import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { DateTime } from 'luxon'

/*
|--------------------------------------------------------------------------
| Provider
|--------------------------------------------------------------------------
|
| Your application is not ready when this file is loaded by the framework.
| Hence, the top level imports relying on the IoC container will not work.
| You must import them inside the life-cycle methods defined inside
| the provider class.
|
| @example:
|
| public async ready () {
|   const Database = this.app.container.resolveBinding('Adonis/Lucid/Database')
|   const Event = this.app.container.resolveBinding('Adonis/Core/Event')
|   Event.on('db:query', Database.prettyPrint)
| }
|
*/
export default class PeerProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
  }

  public async boot() {
    // All bindings are ready, feel free to use them
  }

  public async ready() {
    // App is ready
    const Env = this.app.container.resolveBinding('Adonis/Core/Env')
    const Database = this.app.container.resolveBinding('Adonis/Lucid/Database')

    // save peers to db
    const envPeers = Env.get('PEERS')
    if (!envPeers) {
      return
    }

    let peers = envPeers.split(',')
    for (let url of peers) {
      let peer = await Database.from('peers').select('*').where('url', url).first()
      if (!peer) {
        url = url.trim()
        await Database.table('peers').insert({
          url,
          height: -1,
          score: 0,
          allow_get_data: false,
          allow_post_chunk: false,
          allow_post_tx: false,
          load_time: 999999999,
          last_seen: DateTime.fromMillis(0),
          created_at: DateTime.now(),
          updated_at: DateTime.now(),
        })
      }
    }
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
