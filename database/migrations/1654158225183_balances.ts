import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Balances extends BaseSchema {
  protected tableName = 'balances'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('wallet').notNullable().unique()
      table.string('owner', 2048).notNullable().unique()
      table.string('balance').defaultTo(0)
      table.string('currency').notNullable()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
