import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { buildSchema } from 'type-graphql'
import { GraphQLServer } from '@91codes/adonis-graphql'

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
export default class GraphqlProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
  }

  public async boot() {
    // All bindings are ready, feel free to use them
    const { default: TransactionResolver } = await import('App/Graphql/Resolvers/Transaction')
    const { default: BlockResolver } = await import('App/Graphql/Resolvers/Block')
    const schema = await buildSchema({ resolvers: [TransactionResolver, BlockResolver] })
    const server = new GraphQLServer({ schema, persistedQueries: false })
    await server.start()
    this.app.container.singleton('App/Graphql/Server', () => server)
  }

  public async ready() {
    // App is ready
  }

  public async shutdown() {
    // Cleanup, since app is going down
    const server = this.app.container.use('App/Graphql/Server')
    await server.stop()
  }
}
