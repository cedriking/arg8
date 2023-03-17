import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Peer extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public url: string

  @column()
  public height: number

  @column()
  public loadTime: number

  @column()
  public allowPostTx: boolean

  @column()
  public allowPostChunk: boolean

  @column()
  public allowGetData: boolean

  @column()
  public p3Compatible: boolean

  @column()
  public score: number

  @column.dateTime()
  public lastSeen: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
