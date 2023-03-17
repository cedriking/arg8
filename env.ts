/*
|--------------------------------------------------------------------------
| Validating Environment Variables
|--------------------------------------------------------------------------
|
| In this file we define the rules for validating environment variables.
| By performing validation we ensure that your application is running in
| a stable environment with correct configuration values.
|
| This file is read automatically by the framework during the boot lifecycle
| and hence do not rename or move this file to a different location.
|
*/

import Env from '@ioc:Adonis/Core/Env'

export default Env.rules({
  HOST: Env.schema.string({ format: 'host' }),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string(),
  DRIVE_DISK: Env.schema.enum(['local', 's3', 'gcs'] as const),
  NODE_ENV: Env.schema.enum(['development', 'production', 'testing'] as const),
  DB_CONNECTION: Env.schema.string(),
  PG_HOST: Env.schema.string({ format: 'host' }),
  PG_PORT: Env.schema.number(),
  PG_USER: Env.schema.string(),
  PG_PASSWORD: Env.schema.string.optional(),
  PG_DB_NAME: Env.schema.string(),
  REDIS_CONNECTION: Env.schema.enum(['local'] as const),
  REDIS_HOST: Env.schema.string({ format: 'host' }),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),
  INDEX: Env.schema.enum(['all', 'random', 'appname'] as const),
  INDEX_APP_NAME: Env.schema.string.optional(),
  SENTRY_DSN: Env.schema.string.optional(),
  RABBITMQ_HOSTNAME: Env.schema.string({ format: 'host' }),
  RABBITMQ_PORT: Env.schema.number(),
  RABBITMQ_USER: Env.schema.string(),
  RABBITMQ_PASSWORD: Env.schema.string(),
  DISK_SIZE_LIMIT: Env.schema.number(),
  MY_WALLET_ADDRESS: Env.schema.string(),
  MY_WALLET_FILE: Env.schema.string(),
  BLOCK_CONFIRMATION: Env.schema.number(),
  RATES_CONFIG_PATH: Env.schema.string(),
  PEERS: Env.schema.string.optional(),
  S3_KEY: Env.schema.string.optional(),
  S3_SECRET: Env.schema.string.optional(),
  S3_BUCKET: Env.schema.string.optional(),
  S3_REGION: Env.schema.string.optional(),
  S3_ENDPOINT: Env.schema.string.optional(),
  GCS_KEY_FILENAME: Env.schema.string.optional(),
  GCS_BUCKET: Env.schema.string.optional(),
  GCS_ACL: Env.schema.boolean.optional(),
})
