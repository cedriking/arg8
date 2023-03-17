import checkDisk from 'check-disk-space'
import Env from '@ioc:Adonis/Core/Env'
import { Logs } from './Logs'
const log = new Logs('DiskSize')
const diskSizeLimit = Env.get('DISK_SIZE_LIMIT', 90)

export const diskFull = async () => {
  try {
    const { free, size } = await checkDisk('/')
    const usedPercent = ((size - free) / size) * 100
    log.info(`disk usage ${usedPercent}%`)
    if (usedPercent >= diskSizeLimit) {
      log.error(`disk usage ${usedPercent}% >= ${diskSizeLimit}% worker stopped`)
      return true
    }
  } catch (error) {
    log.error(`${error}`)
  }
  return false
}
