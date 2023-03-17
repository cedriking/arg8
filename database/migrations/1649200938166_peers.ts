import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Peers extends BaseSchema {
  protected tableName = 'peers'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Each peer have specific things they allow,
      // we need to make sure we validate this before sending a request to peers that don't even allow some of this.

      table.boolean('allow_post_tx').defaultTo(false)
      table.boolean('allow_post_chunk').defaultTo(false)
      table.boolean('allow_get_data').defaultTo(false)
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('allow_post_tx')
      table.dropColumn('allow_post_chunk')
      table.dropColumn('allow_get_data')
    })
  }
}
