export default interface InfoResponseInterface {
  network: string
  version: number
  release: number
  height: number
  current: string
  blocks: number
  peers: number
  queue_length: number
  node_state_latency: number
}
