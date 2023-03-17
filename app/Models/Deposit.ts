import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Deposit extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public from: string

  @column()
  public to: string

  @column()
  public amount: string

  @column()
  public txId: string

  @column()
  public block: number

  @column()
  public status: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
