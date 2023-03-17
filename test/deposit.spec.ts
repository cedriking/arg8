import test from 'japa'
import supertest from 'supertest'
import Arlocal from 'arlocal'
import Arweave from 'arweave'
import db from '@ioc:Adonis/Lucid/Database'
import execa from 'execa'
import { bufferTob64Url, stringToBuffer } from 'blockweave/dist/utils/buffer'
import Blockweave from 'blockweave'
import { deepHash } from 'arbundles'
const { exec } = require('node:child_process')

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

test.group('Deposit Tests', (group) => {
  const arlocal = new Arlocal(1984, false)
  const target = 'C35_QeWlp5qxDX8oJKty7OO2Tj81HucWQi74F4G1njw'
  let key1
  let wallet1
  let key2
  let wallet2

  let arweave
  let transaction

  let scheduler

  group.before(async () => {
    scheduler = execa.node('ace', ['scheduler:run'], {
      stdio: 'inherit',
    })
    exec('[ -d tmpLock ] && rm -r tmpLock', console.log)
    exec('[ -f tmp/db.qslite3 ] && rm tmp/db.qslite3', console.log)
    exec(
      'docker ps -q --filter "name=redis-testing" | grep -q . && docker rm -f redis-testing',
      console.log
    )
    exec('docker run -d --rm -p 6379:6379 --name redis-testing redis', console.log)
    execa.node('ace', ['db:seed'], {
      stdio: 'inherit',
    })
    await arlocal.start()

    arweave = Arweave.init({
      host: process.env.HOST,
      port: process.env.PORT,
      protocol: 'http',
    })
    key1 = await arweave.wallets.generate()
    wallet1 = await arweave.wallets.jwkToAddress(key1)

    key2 = await arweave.wallets.generate()
    wallet2 = await arweave.wallets.jwkToAddress(key2)

    await supertest('http://localhost:1984').get(`/mint/${wallet1}/90000000000000000000`)
    await supertest('http://localhost:1984').get(`/mint/${wallet2}/90000000000000000000`)
    await supertest('http://localhost:1984').get(`/mint/${target}/0`)
    await supertest('http://localhost:1984').get(`/mine/100`)

    transaction = await arweave.createTransaction(
      {
        data: 'Hello world',
      },
      key1
    )
    await arweave.transactions.sign(transaction, key1)
    await arweave.transactions.post(transaction)
  })

  group.after(async () => {
    await arlocal.stop()
    scheduler.kill()
    exec('docker rm -f redis-testing', console.log)
  })

  test('Bad Request - invalid SPP headers/header values', async (assert) => {
    const res = await supertest(BASE_URL).get(`/tx/${transaction.id}`)
    assert.equal(res.statusCode, 400)
  })

  test('Unauthorized - User not found', async (assert) => {
    const res = await supertest(BASE_URL)
      .get(`/tx/${transaction.id}`)
      .set('address', key1)
      .set('signature', key1)
    assert.equal(res.statusCode, 401)
  })

  test('Deposit tokens', async (assert) => {
    let w1 = await db.query().from('balances').where('wallet', wallet1).select('*').first()
    let w2 = await db.query().from('balances').where('wallet', wallet2).select('*').first()
    assert.equal(w1, null)
    assert.equal(w2, null)
    let tx1 = await arweave.createTransaction(
      {
        target,
        quantity: 1000,
      },
      key1
    )
    await arweave.transactions.sign(tx1, key1)
    await arweave.transactions.post(tx1)

    let tx2 = await arweave.createTransaction(
      {
        target,
        quantity: 100,
      },
      key2
    )
    await arweave.transactions.sign(tx2, key2)
    await arweave.transactions.post(tx2)

    await arweave.api.get('/mine/6')

    await sleep(1000)
    w1 = await db.query().from('balances').where('wallet', wallet1).select('*').first()
    w2 = await db.query().from('balances').where('wallet', wallet2).select('*').first()

    assert.equal(w1.id, 1)
    assert.equal(w1.balance, '1000')
    assert.equal(w1.wallet, wallet1)

    assert.equal(w2.id, 2)
    assert.equal(w2.balance, '100')
    assert.equal(w2.wallet, wallet2)

    tx1 = await arweave.createTransaction(
      {
        target,
        quantity: 1000,
      },
      key1
    )
    await arweave.transactions.sign(tx1, key1)
    await arweave.transactions.post(tx1)

    tx2 = await arweave.createTransaction(
      {
        target,
        quantity: 100,
      },
      key2
    )
    await arweave.transactions.sign(tx2, key2)
    await arweave.transactions.post(tx2)

    await arweave.api.get('/mine/6')
    while (w1.balance === '1000') {
      await sleep(1000)
      w1 = await db.query().from('balances').where('wallet', wallet1).select('*').first()
    }
    w2 = await db.query().from('balances').where('wallet', wallet2).select('*').first()

    assert.equal(w1.id, 1)
    assert.equal(w1.balance, '2000')
    assert.equal(w1.wallet, wallet1)

    assert.equal(w2.id, 2)
    assert.equal(w2.balance, '200')
    assert.equal(w2.wallet, wallet2)

    tx1 = await arweave.createTransaction(
      {
        target,
        quantity: 1000,
      },
      key1
    )
    await arweave.transactions.sign(tx1, key1)
    await arweave.transactions.post(tx1)

    await arweave.api.get('/mine/6')
    while (w1.balance === '2000') {
      await sleep(1000)
      w1 = await db.query().from('balances').where('wallet', wallet1).select('*').first()
    }
    assert.equal(w1.id, 1)
    assert.equal(w1.balance, '3000')
    assert.equal(w1.wallet, wallet1)

    tx2 = await arweave.createTransaction(
      {
        target,
        quantity: 100,
      },
      key2
    )
    await arweave.transactions.sign(tx2, key2)
    await arweave.transactions.post(tx2)

    await arweave.api.get('/mine/6')
    while (w2.balance === '200') {
      await sleep(1000)
      w2 = await db.query().from('balances').where('wallet', wallet2).select('*').first()
    }

    assert.equal(w2.id, 2)
    assert.equal(w2.balance, '300')
    assert.equal(w2.wallet, wallet2)
  }).timeout(120000)

  test('Unauthorized - Bad signature', async (assert) => {
    let w
    const key = await arweave.wallets.generate()
    const wallet = await arweave.wallets.jwkToAddress(key)
    await supertest('http://localhost:1984').get(`/mint/${wallet}/90000000000000000000`)

    let tx1 = await arweave.createTransaction(
      {
        target,
        quantity: 1000,
      },
      key
    )
    await arweave.transactions.sign(tx1, key)
    await arweave.transactions.post(tx1)

    await arweave.api.get('/mine/6')

    while (!w?.balance) {
      await sleep(1000)
      w = await db.query().from('balances').where('wallet', wallet).select('*').first()
    }

    const res = await supertest(BASE_URL)
      .get(`/tx/${transaction.id}`)
      .set('address', wallet)
      .set('signature', 'something')
    assert.equal(res.statusCode, 401)
  }).timeout(60000)

  test('402 Bad Request - Payment Required - Not enough funds on deposit', async (assert) => {
    let w
    const key = await arweave.wallets.generate()
    const wallet = await arweave.wallets.jwkToAddress(key)
    await supertest('http://localhost:1984').get(`/mint/${wallet}/90000000000000000000`)

    let tx1 = await arweave.createTransaction(
      {
        target,
        quantity: 1,
      },
      key
    )
    await arweave.transactions.sign(tx1, key)
    await arweave.transactions.post(tx1)

    await arweave.api.get('/mine/6')

    while (!w?.balance) {
      await sleep(1000)
      w = await db.query().from('balances').where('wallet', wallet).select('*').first()
    }
    const rawSignature = await Blockweave.crypto.sign(key, await deepHash([stringToBuffer(wallet)]))
    const signature = bufferTob64Url(rawSignature)

    const res = await supertest(BASE_URL)
      .get(`/tx/${transaction.id}`)
      .set('address', wallet)
      .set('signature', signature)
    assert.equal(res.statusCode, 402)
  }).timeout(60000)

  test('200', async (assert) => {
    let w
    const key = await arweave.wallets.generate()
    const wallet = await arweave.wallets.jwkToAddress(key)
    await supertest('http://localhost:1984').get(`/mint/${wallet}/90000000000000000000`)

    let tx1 = await arweave.createTransaction(
      {
        target,
        quantity: 100,
      },
      key
    )
    await arweave.transactions.sign(tx1, key)
    await arweave.transactions.post(tx1)

    await arweave.api.get('/mine/6')

    while (!w?.balance) {
      await sleep(1000)
      w = await db.query().from('balances').where('wallet', wallet).select('*').first()
    }
    assert.equal(w.balance, '100')
    assert.equal(w.wallet, wallet)
    const rawSignature = await Blockweave.crypto.sign(key, await deepHash([stringToBuffer(wallet)]))
    const signature = bufferTob64Url(rawSignature)

    let res = await supertest(BASE_URL)
      .get(`/balance`)
      .set('address', wallet)
      .set('signature', signature)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.balance, 100)

    res = await supertest(BASE_URL)
      .get(`/tx/${transaction.id}`)
      .set('address', wallet)
      .set('signature', signature)
    assert.equal(res.statusCode, 200)

    w = await db.query().from('balances').where('wallet', wallet).select('*').first()
    assert.equal(w.balance, '79')
    res = await supertest(BASE_URL)
      .get(`/balance`)
      .set('address', wallet)
      .set('signature', signature)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.balance, 79)

    const b = await db.query().from('billings').where('id', 1).select('*').first()
    assert.equal(b.price, '21')
    assert.equal(b.service, '/tx/:txid')
  }).timeout(60000)
})
