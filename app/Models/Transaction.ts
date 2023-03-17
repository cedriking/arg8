import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany, ManyToMany } from '@ioc:Adonis/Lucid/Orm'
import Tag from './Tag'

export default class Transaction extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public txid: string

  @column()
  public bundledIn?: string

  @column()
  public format: number

  @column()
  public lastTx: string

  @manyToMany(() => Tag)
  public tags: ManyToMany<typeof Tag>

  @column()
  public target: string

  @column()
  public quantity: number

  @column()
  public data: string

  @column()
  public dataSize: number

  @column()
  public dataRoot: string

  @column()
  public reward: number

  @column()
  public signature: string

  @column()
  public contentType: string

  @column()
  public contentLength: number

  @column()
  public walletId: number

  @column()
  public blockId: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
