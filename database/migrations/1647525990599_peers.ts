import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Peers extends BaseSchema {
  protected tableName = 'peers'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('url', 255).notNullable().unique()
      table.integer('height').notNullable()
      table.integer('load_time').notNullable()
      table.timestamp('last_seen', { useTz: true }).notNullable()
      table.boolean('is_updating').notNullable().defaultTo(false)
      table.boolean('p3_compatible').notNullable().defaultTo(false)
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
