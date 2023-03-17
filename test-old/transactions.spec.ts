import test from 'japa'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`
const txid = 'VW_hYykL6vc5bJ5FaD2V4XN26eQGduAkA5OYjzrek_s'

test.group('Transactions', () => {
  test('/tx/{txid}/status', async (assert) => {
    const { body } = await supertest(BASE_URL).get(`/tx/${txid}/status`).expect(200)

    assert.equal(body.block_height, 899776)
    assert.equal(
      body.block_indep_hash,
      'EHBfxARwCgnopFsoNK4s4NDbkz4gQD1bcxmQN2nP1bW7U1XHWHNxzH1oFbTGCRLH'
    )
    assert.isAbove(body.number_of_confirmations, 0)
  }).timeout(0)

  test('/tx/{txid}/offset', async (assert) => {
    const { body } = await supertest(BASE_URL).get(`/tx/${txid}/offset`).expect(200)

    assert.deepEqual(body, { size: '254', offset: '62590601961972' })
  }).timeout(0)

  test('/tx/{txid}', async (assert) => {
    const { body } = await supertest(BASE_URL).get(`/tx/${txid}`).expect(200)

    assert.equal(body.format, 2)
    assert.equal(body.id, txid)
    assert.equal(body.last_tx, 'J51_bFziqOqwuDuRyzDEHi9Z8_xOpeuXbIji0djW2kGBBMjMCknDxQJMpYXGsT3K')
    assert.equal(
      body.owner,
      '2VNnBNYsd-DWQPkPmoGOXfamV0kGc86bVts-FSWPJNh22l6yLEUObMtJ6gEGC1Hw_2dtgSgb74pPlgbagp8VPX9thRx_611cC0XrDY6Z7VAOnrwCRKIG-VDAa8iko1K9lZMnRDSBl-u0c_EsmuSokjjV6nXB41cAHfIakbg5QdUO7ibh5TzmHSFBQ6xz78vHFhr8m7y4NzrKVzL0AXnenn65Jnpdosasl5Cr5pFeeQ-GUNhhkPq3CPGTEedj_w2yvw-mfNVRHITekToz7YN3KrSl156VLs0LAHlmLSCP1hvQb89i_g5p8WJEcAzdsUX-Ng1mV-m9XhGxaPQDDitx-4RnMfnR0bYbO-St8-2lSPQBulkuGLURzMm25OhAPLsRYHN1dPeXVfMo36vbCUFxkPUrbp-XSvE3haXrho8WYgKrqIxlk29F4L7_yjR2Hb5fmDboryFKnhlRVpJl-kTGrnvo9X8qxkkZdW4Kz0y2GmMaMRzNxbRAirG8pLWSnUXDBTc1rzre9k3OPrkXm9KG_eurkJSxmKAMHKk4TS4kTsf3BljPm6lfjpgWXjAHUyh-EVWVYdZR2EjgpdIN5EkNlIf9v6L5hbBCR2cz-cYDYNXZ3QghxYQpjAO0MAo9SFWZ7Gzu3mpJOP6lkzA7CgIj9-U9vp3XQ60CIkAwetls9D0'
    )
    assert.equal(body.tags.length, 5)
    assert.deepEqual(body.tags, [
      {
        name: 'VXNlci1BZ2VudA',
        value: 'YXJrYg',
      },
      {
        name: 'VXNlci1BZ2VudC1WZXJzaW9u',
        value: 'MS4xLjU0',
      },
      {
        name: 'VHlwZQ',
        value: 'ZmlsZQ',
      },
      {
        name: 'Q29udGVudC1UeXBl',
        value: 'YXBwbGljYXRpb24vanNvbg',
      },
      {
        name: 'RmlsZS1IYXNo',
        value:
          'NTIzMTIzZWYxZjBhYmE2MzRkNWJjMDRhMTJmNDI5ZDNlNmFlM2IwMWI2Y2YwYjZlMDFiZDlmYzdjNTQ4OTAyZg',
      },
    ])
    assert.equal(body.target, '')
    assert.equal(body.quantity, '0')
    assert.equal(body.data, '')
    assert.equal(body.data_size, '254')
    assert.equal(body.data_tree.length, 0)
    assert.equal(body.data_root, 'VFEJmq-ONt4LaTZDl0-W9ZfxHmYOcAVX_JPWOZjE0LA')
    assert.equal(body.reward, '57953313')
    assert.equal(
      body.signature,
      'bdmVbwK5wmXbnqu0l8swVSjeIoVG0hq16z1UeFiUdmBUk4mSXVwbeMOnletGGTUW0BGWW8Kv9aiV4xZ6TEBsKxZMFQqhqUTf7PIvr21TZTaw2wAxOyuEa6fvQyzExMf6ijtrH_9UhetajmsHAK8ere6JMcXaJ7rWNAYfq0O45EucAw3vPizQyrtmBC--OrdKTLWl1d_9cJhZESQk_hlup73_TMOSWDxVAzVmQkvWYb8rfIssi0GlURwNWmFxccpBwnrf6nsEpDFsTC6be5y2xbcBos9jEqH2fb-fGthDkIkV0mUTwlrqiMKsCImxoba5GvjloSqkYSwOFRhf6fOWNgzELvj-O0s3YuAgvCpSLq3dMe7MCojo-aAXc4aJNcm7FHNBF4bCH35GbtDR018tXD8A7MIq9rFeY4N6hVjHXQ4yjkjNPR0L7KOohRp10P0jt-yUh1SWrDz6McA58ltcVGfw4u-AxQWkTJW7UQ0xG62jYvpkn6B5FqQUQY7BD_NfOobDujBeQ-WM70keMGB_MY6zUUoKM3Lknk-_1B2rwunarfLg50_BmMg99kKWyrsoUTD-UiZMjafPCsnLvHW1jGeKoJIq2xfGGcilyYvrjvbJX3qjuOW0ajM_naWRVEcC0Bi6U7quwwzzSJvXTXQoAC9LT3bIbKmFGE341IjO5Kk'
    )
  }).timeout(0)

  test('/tx/{txid}/{field}', async (assert) => {
    const { body } = await supertest(BASE_URL).get(`/tx/${txid}`).expect(200)
    const { text: format } = await supertest(BASE_URL).get(`/tx/${txid}/format`).expect(200)
    const { text: id } = await supertest(BASE_URL).get(`/tx/${txid}/id`).expect(200)
    const { text: lastTx } = await supertest(BASE_URL).get(`/tx/${txid}/last_tx`).expect(200)
    const { text: owner } = await supertest(BASE_URL).get(`/tx/${txid}/owner`).expect(200)
    const { body: tags } = await supertest(BASE_URL).get(`/tx/${txid}/tags`).expect(200)
    const { text: target } = await supertest(BASE_URL).get(`/tx/${txid}/target`).expect(204)
    const { text: quantity } = await supertest(BASE_URL).get(`/tx/${txid}/quantity`).expect(200)
    const { text: dataSize } = await supertest(BASE_URL).get(`/tx/${txid}/data_size`).expect(200)
    const { body: dataTree } = await supertest(BASE_URL).get(`/tx/${txid}/data_tree`).expect(200)
    const { text: dataRoot } = await supertest(BASE_URL).get(`/tx/${txid}/data_root`).expect(200)
    const { text: reward } = await supertest(BASE_URL).get(`/tx/${txid}/reward`).expect(200)
    const { text: signature } = await supertest(BASE_URL).get(`/tx/${txid}/signature`).expect(200)

    assert.equal(body.format, format)

    assert.equal(body.id, id)
    assert.equal(body.last_tx, lastTx)
    assert.equal(body.owner, owner)
    assert.equal(body.tags.length, tags.length)
    assert.deepEqual(body.tags, tags)
    assert.equal(body.target, target)
    assert.equal(body.quantity, quantity)
    assert.equal(body.data_size, dataSize)
    assert.equal(body.data_tree.length, dataTree?.length)
    assert.equal(body.data_root, dataRoot)
    assert.equal(body.reward, reward)
    assert.equal(body.signature, signature)
  }).timeout(0)

  test('/{txid}', async (assert) => {
    const { body } = await supertest(BASE_URL).get(`/${txid}`).expect(200)
    assert.deepEqual(body, {
      compilerOptions: {
        target: 'esNext',
        module: 'commonjs',
        declaration: true,
        outDir: './bin',
        esModuleInterop: true,
        skipLibCheck: true,
      },
      include: ['src'],
      exclude: ['node_modules', '**/__tests__/*'],
    })
  }).timeout(0)
  test.group('Bundle', () => {
    const BundleId = '7Caub1IZ0t_IfcVbN9NwAgc30EvzipNTkQD66K8hIx4'
    const bundlrs = [
      '-0NVUY45nz1ERLGNXU853xkYfR-wYpxqjMlNyonBzmY',
      'RIOMXbfGe_gT5WNPQi3m0a3IzDrnTtkdh5-pcMhM3-I',
      'nWg9kAQhE3ffvv1wdJ47C58A4X7hgCNNkbUn0ThrmGU',
      'ETBPnIpRPMy2_SOvW1XfABS25RZUL1bb4RmgG7iIuBg',
    ]

    test('Should GET the Bundle', async (assert) => {
      let { statusCode } = await supertest(BASE_URL).get(`/tx/${BundleId}`)
      assert.equal(statusCode, 200)
    }).timeout(0)

    test('Should GET Bundlrs', async (assert) => {
      await Promise.all(
        bundlrs.map(async (bundlr) => {
          const { statusCode } = await supertest(BASE_URL).get(`/tx/${bundlr}`)
          assert.equal(statusCode, 200)
        })
      )
    }).timeout(0)
  })
})
