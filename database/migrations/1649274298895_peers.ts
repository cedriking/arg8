import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Peers extends BaseSchema {
  protected tableName = 'peers'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_updating')
      table.integer('score').notNullable().defaultTo(0)
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_updating').notNullable().defaultTo(false)
      table.dropColumn('score')
    })
  }
}
