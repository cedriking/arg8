export default interface BlockResponseInterface {
  nonce: string
  previous_block: string
  timestamp: number
  last_retarget: number
  diff: string
  height: number
  hash: string
  indep_hash: string
  txs: string[]
  tx_root: string
  tx_tree: string[]
  wallet_list: string
  reward_addr: string
  tags: string[]
  reward_pool: number
  weave_size: number
  block_size: number
  cumulative_diff: number
  hash_list_merkle: string
  poa: {
    option: string
    tx_path: string
    data_path: string
    chunk: string
  }
}
