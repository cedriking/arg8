import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class TransactionTags extends BaseSchema {
  protected tableName = 'transaction_tag'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('transaction_id').unsigned().references('transactions.id')
      table.integer('tag_id').unsigned().references('tags.id')
      table.unique(['transaction_id', 'tag_id'])

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
