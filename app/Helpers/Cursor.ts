export type ISO8601DateTimeString = string
export interface Cursor {
  timestamp: ISO8601DateTimeString
  offset: number
}

export const newCursor = (): string =>
  encodeCursor({ timestamp: new Date().toISOString(), offset: 0 })

export const encodeCursor = ({ timestamp, offset }: Cursor): string => {
  const str = JSON.stringify([timestamp, offset])
  return Buffer.from(str).toString('base64')
}

export const parseCursor = (cursor: string): Cursor => {
  try {
    const [timestamp, offset] = JSON.parse(Buffer.from(cursor, 'base64').toString()) as [
      ISO8601DateTimeString,
      number
    ]
    return { timestamp, offset }
  } catch (error) {
    throw new Error('invalid cursor')
  }
}
