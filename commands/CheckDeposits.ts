import { BaseCommand } from '@adonisjs/core/build/standalone'
import { Logs } from 'App/Helpers/Logs'
import Deposit from 'App/Models/Deposit'

export default class GetBlocks extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'check:deposits'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Check deposits'

  public static settings = {
    /**
     * Set the following value to true, if you want to load the application
     * before running the command. Don't forget to call `node ace generate:manifest`
     * afterwards.
     */
    loadApp: true,

    /**
     * Set the following value to true, if you want this command to keep running until
     * you manually decide to exit the process. Don't forget to call
     * `node ace generate:manifest` afterwards.
     */
    stayAlive: false,
  }

  public async run() {
    const log = new Logs('CheckDeposits')
    const pendingDeposit = await Deposit.query().where('status', '=', 'Pending')
    console.log({
      pendingDeposit: pendingDeposit.map(
        ({ id, from, txId, amount }) => `${id}: ${from} sent ${amount} in the tx ${txId}`
      ),
    })
  }
}
