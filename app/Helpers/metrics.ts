import Prometheus from '@ioc:Adonis/Prometheus'

// Register your custom metrics in the separate file you want.
export const getBlocksMetrics = new Prometheus.Counter({
  name: 'get_blocks',
  help: 'Total blocks request success',
})

export const failedBlocksMetrics = new Prometheus.Counter({
  name: 'failed_blocks',
  help: 'Total blocks request failed',
})

export const getTxsMetrics = new Prometheus.Counter({
  name: 'get_txs',
  help: 'Total transactions request success',
})

export const failedTxsMetrics = new Prometheus.Counter({
  name: 'failed_txs',
  help: 'Total transactions request failed',
})

export const getDataTxsMetrics = new Prometheus.Counter({
  name: 'get_data_txs',
  help: 'Total data transaction request success',
})

export const failedDataTxsMetrics = new Prometheus.Counter({
  name: 'failed_data_txs',
  help: 'Total data transaction request failed',
})

export const postTxMetrics = new Prometheus.Counter({
  name: 'post_tx',
  help: 'Total transactions post success',
})

export const failedPostTxMetrics = new Prometheus.Counter({
  name: 'failed_post_tx',
  help: 'Total transactions post failed',
})
