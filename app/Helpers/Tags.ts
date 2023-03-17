import { TransactionResponseInterface } from 'App/Interfaces/TransactionResponse'
import { atob } from 'App/Helpers/Encoding'

export const getAppName = (tx: TransactionResponseInterface): string => {
  const appTag = tx.tags.find((tag) => tag.name === 'QXBwLU5hbWU')
  if (appTag) {
    // Value is in base64, return the string of the base64
    return atob(appTag.value)
  }

  return ''
}

export const isAns104 = (tags: { name: string; value: string }[]) => {
  let bundleFormat = ''
  let bundleVersion = ''

  for (const tag of tags) {
    const name = atob(tag.name)
    const value = atob(tag.value)

    if (name === 'Bundle-Format') bundleFormat = value
    if (name === 'Bundle-Version') bundleVersion = value
  }
  if (bundleFormat === 'binary' && bundleVersion === '2.0.0') return true
  return false
}
export const getContentType = (tags: { name: string; value: string }[]): string => {
  const tag = tags.find(({ name }) => atob(name) === 'Content-Type')
  return tag?.value ? atob(tag.value) : 'application/octet-stream'
}
