import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Transactions extends BaseSchema {
  protected tableName = 'transactions'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('block_id').unsigned().references('blocks.id').onDelete('CASCADE')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('block_id')
    })
  }
}
