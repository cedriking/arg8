import 'reflect-metadata'
import { join } from 'path'
import getPort from 'get-port'
import { configure } from 'japa'
import execa from 'execa'
import sourceMapSupport from 'source-map-support'

process.env.NODE_ENV = 'testing'
process.env.ADONIS_ACE_CWD = join(__dirname)
sourceMapSupport.install({ handleUncaughtExceptions: false })

async function startHttpServer() {
  process.env.TEST = 'NEW'

  const { Ignitor } = await import('@adonisjs/core/build/src/Ignitor')
  process.env.PORT = String(await getPort())
  await new Ignitor(__dirname).httpServer().start()
}

async function runMigrations() {
  await execa.node('ace', ['migration:run'], {
    stdio: 'inherit',
  })
}

async function startTasks() {
  execa.node('ace', ['scheduler:run'], {
    stdio: 'inherit',
  })
}

async function rollbackMigrations() {
  await execa.node('ace', ['migration:rollback', '--batch=0'], {
    stdio: 'inherit',
  })
  process.env.TEST = ''
}

/**
 * Configure test runner
 */
configure({
  files: ['test/**/*.spec.ts'],
  before: [runMigrations, startHttpServer, startTasks],
  after: [rollbackMigrations],
})
