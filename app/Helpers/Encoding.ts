import { Readable } from 'stream'
import crypto from 'crypto'

export const atob = (data: string) => Buffer.from(data, 'base64').toString('binary')

export const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  let buffer = Buffer.alloc(0)
  return new Promise((resolve) => {
    stream.on('data', (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk])
    })

    stream.on('end', () => {
      resolve(buffer)
    })
  })
}

export const streamToString = async (stream: Readable): Promise<string> => {
  return (await streamToBuffer(stream)).toString('utf-8')
}

export const bufferToJson = <T = any | undefined>(input: Buffer): T => {
  return JSON.parse(input.toString('utf8'))
}

export const jsonToBuffer = (input: object): Buffer => {
  return Buffer.from(JSON.stringify(input))
}

export const streamToJson = async <T = any | undefined>(input: Readable): Promise<T> => {
  return bufferToJson<T>(await streamToBuffer(input))
}

export const toSha1 = (input: string): string => {
  return crypto.createHash('sha1').update(input).digest('hex')
}

export function toSha256(data: Uint8Array): Uint8Array {
  return crypto.createHash('sha256').update(data).digest()
}
