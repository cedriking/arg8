import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class TagTransactions extends BaseSchema {
  protected tableName = 'tag_transaction'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('transaction_id').unsigned().references('transactions.id')
      table.integer('tag_id').unsigned().references('tags.id')
      table.unique(['transaction_id', 'tag_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
