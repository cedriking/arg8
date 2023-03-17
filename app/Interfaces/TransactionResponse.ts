export interface TransactionResponseInterface {
  format: number
  id: string
  last_tx: string
  owner: string
  tags: { name: string; value: string }[]
  target: string
  quantity: string
  data: string
  data_size: string
  data_tree: string[]
  data_root: string
  reward: string
  signature: string
  bundled_in?: string
}

export interface TransactionStatusResponseInterface {
  block_height: number
  block_indep_hash: string
  number_of_confirmations: number
}

export interface TransactionOffsetResponseInterface {
  offset: string
  size: string
}
