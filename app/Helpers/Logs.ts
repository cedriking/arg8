import clc from 'cli-color'

export class Logs {
  constructor(private name: string) {}

  info(msg: string) {
    this.log(msg, 'yellow')
  }
  success(msg: string) {
    this.log(msg, 'blueBright')
  }
  error(msg: string) {
    this.log(msg, 'red')
  }

  private log(msg: string, color: string) {
    console.log(
      `[${new Date().toLocaleString()}] ${clc[color](this.name)} ${clc.blackBright('|')} ${clc[
        color
      ](msg)}`
    )
  }
}
