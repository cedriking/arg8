import { arweave, getBalance } from '../utils/arweave'
import { showMessage, cleanMessage } from '../utils/message'

$(() => {
  $('.fund-form').on('submit', (e) => {
    e.preventDefault()
    handleFund()
  })
})

async function handleFund() {
  cleanMessage()

  $('.fund-button, .fund-input').attr('disabled', true)

  $('.fund-button').html(`
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Funding
      `)

  const quantity = +$('.fund-input').val()
  if (isNaN(quantity) || quantity < 0.000001) {
    return showMessage('Please enter a valid amount', true)
  }

  const address = await window.arweaveWallet.getActiveAddress()
  const bal = await getBalance(address)
  if (+bal < quantity) {
    $('.ar-balance').text(bal)
    return showMessage('Not enough funds', true)
  }

  const res = await fetch('/rates')
  const data = await res.json()
  const target = data.endpoints[0].rates.arweave.address
  try {
    const tx = await arweave.createTransaction({
      quantity: arweave.ar.arToWinston(quantity.toString()),
      target,
      data: `${Math.random().toString().slice(3, 8)}`,
    })
    await arweave.transactions.sign(tx, 'use_wallet')
    const txRes = await arweave.transactions.post(tx)

    if (txRes.status === 200) {
      showMessage(
        `Deposit Transaction ID: <a href="https://v2.viewblock.io/arweave/tx/${tx.id}" target="_blank">${tx.id}</a>`
      )
    } else {
      showMessage(`${txRes.status} - ${txRes.statusText}`, true)
    }

    console.log({ txRes })
  } catch (error) {
    showMessage(error.message, true)
  }
}
