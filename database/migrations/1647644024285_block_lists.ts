import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import { GRABBER_STATUS } from 'App/Enums/Grabber'

export default class BlockLists extends BaseSchema {
  protected tableName = 'block_lists'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('id').primary()
      table.enu('status', Object.values(GRABBER_STATUS), {
        useNative: true,
        enumName: 'block_status',
        existingType: false,
      })

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS "block_status"')
  }
}
