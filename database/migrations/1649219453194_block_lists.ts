import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class BlockLists extends BaseSchema {
  protected tableName = 'block_lists'

  public async up() {
    this.schema.dropTableIfExists(this.tableName)
  }

  public async down() {}
}
