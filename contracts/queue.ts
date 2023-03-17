export interface bundlrProps {
  tx: {
    format: number
    lastTx: string
    quantity: number
    data: string
    dataSize: number
    dataRoot: string
    reward: number
    signature: string
    blockId: any
    walletId: number
    target: string
    contentType: string
    bundledIn: string
  }
  tags: {
    name: string
    value: string
  }[]
  id: string
}
export interface driveProps {
  data?: string
  id: string
  contentType: string
  type: string
  endpoint?: string
}

export enum DRIVE_TYPE {
  BUFFER = 'buffer',
  STREAM = 'stream',
}

export enum QUEUE_NAMES {
  BLOCK = 'BLOCK',
  BUNDLR = 'BUNDLR',
  DRIVE = 'DRIVE',
  TRANSACTION = 'TRANSACTION',
  PEER = 'PEER',
}
