import { DateTime } from 'luxon'
import { BaseModel, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Transaction from './Transaction'

export default class Block extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public indepHash: string

  @column()
  public nonce: string

  @column()
  public previousBlock: string

  @column.dateTime()
  public timestamp: DateTime

  @column.dateTime()
  public lastRetarget: DateTime

  @column()
  public diff: string

  @column()
  public height: number

  @column()
  public hash: string

  @column()
  public txs: string

  @hasMany(() => Transaction)
  public transactions: HasMany<typeof Transaction>

  @column()
  public walletList: string

  @column()
  public rewardAddr: string

  @column()
  public rewardPool: number

  @column()
  public weaveSize: number

  @column()
  public blockSize: number

  @column()
  public cumulativeDiff: number

  @column()
  public hashListMerkle: string

  @column()
  public poaOption: number

  @column()
  public poaTxPath: string

  @column()
  public poaDataPath: string

  @column()
  public poaChunk: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
