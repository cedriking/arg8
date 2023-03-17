/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import HealthCheck from '@ioc:Adonis/Core/HealthCheck'
import Route from '@ioc:Adonis/Core/Route'

Route.get('/', ({ view }) => {
  return view.render('home')
})

Route.group(() => {
  Route.get('/:txid/status', 'TransactionsController.getStatus').where('txid', /^[a-z0-9-_]{43}$/i)
  Route.get('/:txid/offset', 'TransactionsController.getOffset').where('txid', /^[a-z0-9-_]{43}$/i)
  Route.get('/:txid/data.:type', 'TransactionsController.getData')
    .where('txid', /^[a-z0-9-_]{43}$/i)
    .where('type', /\w+$/)
  Route.get('/:txid/data', 'TransactionsController.getData').where('txid', /^[a-z0-9-_]{43}$/i)
  Route.get('/:txid/:field', 'TransactionsController.getField')
    .where('txid', /^[a-z0-9-_]{43}$/i)
    .where('field', /\w+$/)
    .middleware('auth')
  Route.get('/:txid/:picky', 'RedirectsController.get').where('txid', /^[a-z0-9-_]{43}$/i)
  Route.get('/:txid', 'TransactionsController.getTx')
    .where('txid', /^[a-z0-9-_]{43}$/i)
    .middleware('auth')
  Route.post('', 'TransactionsController.postTx')
}).prefix('/tx')

Route.group(() => {
  Route.get('/:bytes/:target', 'RedirectsController.get').where('target', /^[a-z0-9-_]{43}$/i)
  Route.get('/:bytes', 'RedirectsController.get')
}).prefix('/price')

Route.get('/wallet/:address/:picky', 'RedirectsController.get').where(
  'address',
  /^[a-z0-9-_]{43}$/i
)

Route.group(() => {
  Route.get('/hash/:hash', 'BlocksController.getByIndepHash').where('hash', /^[a-z0-9-_]{64}$/i)
  Route.get('/height/:height', 'BlocksController.getByHeight').where('height', /^[0-9]+$/)
}).prefix('/block')

Route.get('health', async ({ response }) => {
  const report = await HealthCheck.getReport()

  return report.healthy ? response.ok(report) : response.badRequest(report)
})

Route.get('/atq/:key/:height', 'BlocksController.addToQueue') // atq = add to queue

Route.get('/rates', 'RatesController.rates')
Route.get('/info', 'NetworksController.info')
Route.get('/peers', 'RedirectsController.get')
Route.get('/tx_anchor', 'RedirectsController.get')
// Route.route('/graphql', ['GET', 'POST'], 'GraphqlController.serve').middleware('auth')
Route.get('/graphql', 'GraphqlController.serve').middleware('auth')
Route.post('/graphql', 'RedirectsController.post').middleware('auth')

Route.post('/chunk', 'ChunksController.post')
Route.get('/:txid', 'TransactionsController.getData')
  .where('txid', /^\/?([a-zA-Z0-9-_]{43})\/?$|^\/?([a-zA-Z0-9-_]{43})\/(.*)$/i)
  .middleware('auth')

Route.get('/:txid/*', 'TransactionsController.getManifestField')
  .where('txid', /^\/?([a-zA-Z0-9-_]{43})\/?$|^\/?([a-zA-Z0-9-_]{43})\/(.*)$/i)
  .middleware('auth')

Route.get('/balance', 'BalancesController.get')
Route.get('/*', 'RedirectsController.get')
