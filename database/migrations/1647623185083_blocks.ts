import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Blocks extends BaseSchema {
  protected tableName = 'blocks'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('indep_hash', 64).notNullable().unique()
      table.text('nonce').notNullable()
      table.string('previous_block', 64).notNullable()
      table.dateTime('timestamp').notNullable()
      table.dateTime('last_retarget').notNullable()
      table.string('diff').notNullable()
      table.integer('height').notNullable()
      table.string('hash', 64).notNullable()
      table.text('txs').notNullable()
      table.string('wallet_list', 64).notNullable()
      table.string('reward_addr', 43).notNullable()
      table.bigInteger('reward_pool').notNullable()
      table.bigInteger('weave_size').notNullable()
      table.bigInteger('block_size').notNullable()
      table.bigInteger('cumulative_diff').nullable()
      table.string('hash_list_merkle', 64).nullable()
      table.integer('poa_option').notNullable()
      table.text('poa_tx_path').notNullable()
      table.text('poa_data_path').notNullable()
      table.text('poa_chunk').notNullable()

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
