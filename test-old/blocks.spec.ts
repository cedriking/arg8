import test from 'japa'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`
const block = {
  height: 400000,
  hash: 'sxUfKf7V3MbACHng7xX4XHYncabhV32ylMHM1bzEaWFwvDuxpb8ztwa5CepBmOCP',
  data: {
    nonce: '8AwDgiV20GT-VhqRNK_85L1kMtBHe97-XFX7AqYNc5w',
    previous_block: '2F_qJBFC5CMinQ2qX8KABXdlABqKN6M5glMh4xZ8fX9QgPV0gp1dpm4An3scxW8n',
    timestamp: 1583605787,
    last_retarget: 1583605787,
    diff: '115792089132372726551401365154981800625411190796400577039502512421705281961984',
    height: 400000,
    hash: '_____hFJaKzCuBqDMaBYw3I9712-LD8lq2FrrrRxldc',
    indep_hash: 'sxUfKf7V3MbACHng7xX4XHYncabhV32ylMHM1bzEaWFwvDuxpb8ztwa5CepBmOCP',
    txs: [
      'hJqw2Vq0et39eS3J3XVVNFHyRDGRqac6ktAmPnRgzYU',
      'R4bfN8_q7gbJEVUjhQUHPePizjEDd3wiCq89azGFWuY',
      '0nCW41AkxpPvP-atfNtWLY4UJZOOaQTkESqqhmt-Lo4',
      '3fugTACi7ARTSDuMtpAaw8oLyhw20eBTFMf0AMUsssE',
      'h0xJc1UJC1vzmyH4lPurEec-2l0laN2TQ0Gc1SvU3L0',
      'hwta2BxMJvOcu0m5BDQfLc7g1z5lPK-w93J0XD_oe3A',
      '2RRjAF8etGofawOFdKlaX5GRpQrruZYTILEUOJkEFTw',
      'aBvKHao1eSeXMxwyCLpYP0G_6XJEXncfgDU7gEImdOc',
    ],
    tx_root: '',
    tx_tree: [],
    wallet_list: '2Y82G-3EO4-MaINrQhDHqXhZfPokzXC6tykCBfoEqus',
    reward_addr: 'HfKICxDeO1layLZo3qWbvRkyDAPSX1HfZUXfjbbtaMc',
    tags: [],
    reward_pool: 2710402901913567,
    weave_size: 326076724794,
    block_size: 377171,
    cumulative_diff: '77132537440620',
    hash_list_merkle: 'uQXrF5iwLGmkqCSzLJTsIzgsUUviwkfoOxPuGO15TilQIGjDsNHNaEfN4hASmoj1',
    poa: {
      option: '1',
      tx_path: '',
      data_path: '',
      chunk: '',
    },
  },
}

test.group('Blocks', () => {
  test('/block/height/{height}', async (assert) => {
    const { body } = await supertest(BASE_URL).get(`/block/height/${block.height}`).expect(200)
    assert.deepEqual(body, block.data)
  }).timeout(0)

  test('/block/hash/{hash}', async (assert) => {
    const { body } = await supertest(BASE_URL).get(`/block/hash/${block.hash}`).expect(200)
    assert.deepEqual(body, block.data)
  }).timeout(0)
})
