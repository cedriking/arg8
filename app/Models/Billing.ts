import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Balance from './Balance'

export default class Billing extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @belongsTo(() => Balance)
  public balance: BelongsTo<typeof Balance>

  @column()
  public balanceId: number

  @column()
  public price: string

  @column()
  public service: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
