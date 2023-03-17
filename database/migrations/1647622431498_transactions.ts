import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Transactions extends BaseSchema {
  protected tableName = 'transactions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('txid', 43).notNullable().unique()
      table.string('bundled_in', 43).nullable()
      table.integer('format').notNullable()
      table.string('last_tx', 64).notNullable()
      table.string('target', 43).nullable()
      table.bigInteger('quantity').notNullable()
      table.text('data').notNullable()
      table.bigInteger('data_size').notNullable()
      table.string('data_root', 43).notNullable()
      table.bigInteger('reward').notNullable()
      table.text('signature').notNullable()
      table.string('content_type').nullable()
      table.integer('content_length').nullable()

      table.integer('wallet_id').unsigned().references('wallets.id').onDelete('CASCADE')

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
