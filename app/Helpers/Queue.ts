import { bundlrProps, driveProps, QUEUE_NAMES } from 'Contracts/queue'
import Rabbit from '@ioc:Adonis/Addons/Rabbit'
import { Logs } from 'App/Helpers/Logs'

const log = new Logs('QUEUE')

export const createBlockJob = async (height: number) => {
  try {
    await Rabbit.assertQueue(QUEUE_NAMES.BLOCK, {
      durable: true,
      arguments: { 'x-message-deduplication': true },
    })
    await Rabbit.sendToQueue(
      QUEUE_NAMES.BLOCK,
      { id: height },
      {
        headers: {
          'x-message-deduplication': true,
          'x-deduplication-header': `block:${height}`,
        },
      }
    )
  } catch (error) {
    log.error(`Error adding block ${height} to queue: ${height}`)
  }
}

export const createBundleJob = async (params: bundlrProps) => {
  try {
    await Rabbit.assertQueue(QUEUE_NAMES.BUNDLR, {
      durable: true,
      arguments: { 'x-message-deduplication': true },
    })
    await Rabbit.sendToQueue(QUEUE_NAMES.BUNDLR, params, {
      headers: {
        'x-message-deduplication': true,
        'x-deduplication-header': `bundle:${params.id}`,
      },
    })
  } catch (error) {
    log.error(`Error adding bundle ${params.id} to queue`)
  }
}
export const createDriveJob = async (params: driveProps) => {
  try {
    await Rabbit.assertQueue(QUEUE_NAMES.DRIVE, {
      durable: true,
      arguments: { 'x-message-deduplication': true },
    })
    await Rabbit.sendToQueue(QUEUE_NAMES.DRIVE, params, {
      headers: {
        'x-message-deduplication': true,
        'x-deduplication-header': `drive:${params.id}`,
      },
    })
  } catch (error) {
    log.error(`Error adding drive ${params.id} to queue`)
  }
}
export const createTransactionJob = async (txid: string) => {
  try {
    await Rabbit.assertQueue(QUEUE_NAMES.TRANSACTION, {
      durable: true,
      arguments: { 'x-message-deduplication': true },
    })
    await Rabbit.sendToQueue(
      QUEUE_NAMES.TRANSACTION,
      { id: txid },
      {
        headers: {
          'x-message-deduplication': true,
          'x-deduplication-header': `transaction:${txid}`,
        },
      }
    )
  } catch (error) {
    log.error(`Error adding transction ${txid} to queue`)
  }
}
export const createPeerJob = async (id: number) => {
  try {
    await Rabbit.assertQueue(QUEUE_NAMES.PEER, {
      durable: true,
      arguments: { 'x-message-deduplication': true },
    })
    await Rabbit.sendToQueue(
      QUEUE_NAMES.PEER,
      { id },
      {
        headers: {
          'x-message-deduplication': true,
          'x-deduplication-header': `peer:${id}`,
        },
      }
    )
  } catch (error) {
    log.error(`Error adding transction ${id} to queue`)
  }
}
