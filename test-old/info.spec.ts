import test from 'japa'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

test.group('Info', () => {
  test('GET /', async (assert) => {
    /**
     * Make request
     */
    const { body } = await supertest(BASE_URL).get('/').expect(200)
    assert.equal(body.network, 'arg8.Beta.1')
    assert.equal(body.version, '1')
    assert.equal(body.release, '1.0.0')
    assert.isAbove(body.height, 0)
  }).timeout(0)

  test('GET /info', async (assert) => {
    /**
     * Make request
     */
    const { body } = await supertest(BASE_URL).get('/info').expect(200)
    assert.equal(body.network, 'arg8.Beta.1')
    assert.equal(body.version, '1')
    assert.equal(body.release, '1.0.0')
    assert.isAbove(body.height, 0)
  }).timeout(0)
})
