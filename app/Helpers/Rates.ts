import { existsSync, readFileSync } from 'fs'
import Env from '@ioc:Adonis/Core/Env'

const sprintf = require('sprintf-js').sprintf

export const loadRatesConf = () => {
  try {
    if (!existsSync('./rates.conf')) {
      console.error('Please provide a file called rates.config.')
      return
    }
    const ratesConf = readFileSync('./rates.conf', 'utf-8')
    const ratesJson = JSON.parse(sprintf(ratesConf, { address: Env.get('MY_WALLET_ADDRESS') }))

    ratesJson.endpoints.forEach((endpoint) => {
      if (endpoint.rates.arweave.price < 0) endpoint.rates.arweave.price = 0
    })

    return ratesJson
  } catch (error) {
    console.log({ error })
    return {}
  }
}

export const getRate = (service: string) => {
  const ratesJson = loadRatesConf()
  const endpoint = ratesJson.endpoints.find((e) => e.endpoint === service)
  return +endpoint.rates.arweave.price
}

export const getService = (path: string, params: any) => {
  const ressource = path.split('/')[1]
  const url = ressource === 'tx' ? '/tx' : ressource === 'graphql' ? '/graphql' : undefined
  let service = [url, ...Object.keys(params).map((k) => `:${k}`)].join('/')
  if (service.endsWith('/:*')) service = service.replace('/:*', '')

  return service
}
