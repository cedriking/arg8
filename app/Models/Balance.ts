import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Balance extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public wallet: string

  @column()
  public owner: string

  @column()
  public balance: string

  @column()
  public currency: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
