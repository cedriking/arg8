export const arweave = Arweave.init({
  host: window.location.hostname,
  port: window.location.port || 443,
  protocol: window.location.protocol.slice(0, -1),
})

export async function getInternalBalance() {
  const res = await arweave.api.get('/balance')
  if (!res?.data?.balance) return 0
  return await arweave.ar.winstonToAr(res.data.balance)
}

export async function getBalance(address) {
  const bal = await arweave.wallets.getBalance(address)
  return arweave.ar.winstonToAr(bal, {
    formatted: true,
    decimals: 6,
    trim: true,
  })
}

export async function deepHash(data) {
  if (Array.isArray(data)) {
    const tag = Arweave.utils.concatBuffers([
      Arweave.utils.stringToBuffer('list'),
      Arweave.utils.stringToBuffer(data.length.toString()),
    ])

    return await deepHashChunks(data, await Arweave.crypto.hash(tag, 'SHA-384'))
  }

  const tag = Arweave.utils.concatBuffers([
    Arweave.utils.stringToBuffer('blob'),
    Arweave.utils.stringToBuffer(data.byteLength.toString()),
  ])

  const taggedHash = Arweave.utils.concatBuffers([
    await Arweave.crypto.hash(tag, 'SHA-384'),
    await Arweave.crypto.hash(data, 'SHA-384'),
  ])

  return await Arweave.crypto.hash(taggedHash, 'SHA-384')
}

async function deepHashChunks(chunks, acc) {
  if (chunks.length < 1) {
    return acc
  }

  const hashPair = Arweave.utils.concatBuffers([acc, await deepHash(chunks[0])])
  const newAcc = await Arweave.crypto.hash(hashPair, 'SHA-384')
  return await deepHashChunks(chunks.slice(1), newAcc)
}
