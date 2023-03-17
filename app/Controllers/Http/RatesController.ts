import { loadRatesConf } from 'App/Helpers/Rates'

export default class RatesController {
  public async rates() {
    return loadRatesConf()
  }
}
