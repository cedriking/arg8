import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Deposits extends BaseSchema {
  protected tableName = 'deposits'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('from').notNullable()
      table.string('to').notNullable()
      table.string('amount').notNullable()
      table.string('tx_id').notNullable().unique()
      table.string('status').notNullable().defaultTo('Pending')
      table.integer('block').notNullable()

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
