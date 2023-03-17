import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class TransactionLists extends BaseSchema {
  protected tableName = 'transaction_lists'

  public async up() {
    this.schema.dropTableIfExists(this.tableName)
  }

  public async down() {}
}
