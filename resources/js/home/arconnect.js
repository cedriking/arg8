import { bufferTob64Url } from '../utils/b64'
import { generateAvatar } from '../utils/avatar'
import { deepHash, getInternalBalance } from '../utils/arweave'
import { Cookies } from '../utils/cookies'

let walletLoaded = false
let domLoaded = false
window.addEventListener('arweaveWalletLoaded', async () => {
  walletLoaded = true

  if (domLoaded) {
    loadLogin()
  }
})

window.addEventListener('walletSwitch', (e) => {
  const newAddress = e.detail.address
  console.log('Address changed', newAddress)
  if (domLoaded) {
    loadLogin()
  }
})

async function loadLogin() {
  $('.login-button').removeAttr('disabled')
  const permissions = await window.arweaveWallet.getPermissions()
  if (permissions.length) {
    // hide the login button
    await handleLogin()
  }
}

$(() => {
  domLoaded = true
  if (walletLoaded) {
    loadLogin()
  }

  updateBalance()

  $('.login-button').on('click', (e) => {
    e.preventDefault()

    if (!window.arweaveWallet) return

    handleLogin()
  })

  $(document).on('click', '.logout-button', (e) => {
    e.preventDefault()
    logout()
  })
})

const ARCONNECT_PERMISSIONS = [
  'ACCESS_ADDRESS',
  'ACCESS_PUBLIC_KEY',
  'ACCESS_ALL_ADDRESSES',
  'SIGNATURE',
  'SIGN_TRANSACTION',
  'ACCESS_ARWEAVE_CONFIG',
]

async function handleLogin() {
  const encoder = new TextEncoder()

  await window.arweaveWallet.connect(ARCONNECT_PERMISSIONS)
  const address = await window.arweaveWallet.getActiveAddress()
  const rawSignature = await window.arweaveWallet.signature(
    await deepHash([encoder.encode(address)]),
    {
      name: 'RSA-PSS',
      saltLength: 32,
    }
  )
  const signature = bufferTob64Url(rawSignature)

  Cookies.deleteAll()
  Cookies.set('address', address)
  Cookies.set('signature', signature)

  const balance = await getInternalBalance()

  $('.login-button, .fund-input, .fund-button').removeAttr('disabled')

  // update ui
  $('.login-container').removeClass('col-2').addClass('col-4').html(`
    <div class="row align-items-center justify-content-start">
      <div class="col-2">
        <img src="${generateAvatar(address, 40)}" alt="avatar" class="rounded-circle">
      </div>
      <div class="col-10">
        <p class="text-right my-0 text-truncate" style="font-weight: 500;" data-toggle="tooltip" data-placement="bottom" title="${address}">${address}</p>
        <div class="d-flex justify-content-between">
          <p class="text-right my-0 text-muted"><span class="ar-balance">${balance}</span> AR</p>
          <button class="btn btn-primary btn-sm btn-custom logout-button">
            <span class="mr-3">
              <i class="fa fa-solid fa-door-open"></i>
            </span>
            Logout
          </button>
        </div>
      </div>
    </div>
  `)
}

async function logout() {
  Cookies.deleteAll()

  await window.arweaveWallet.disconnect()
  window.location.reload()
}

async function updateBalance() {
  if (!walletLoaded) {
    setTimeout(() => {
      updateBalance()
    }, 1000 * 10)
  }
  const bal = await getInternalBalance()
  $('.ar-balance').text(bal)

  setTimeout(() => {
    updateBalance()
  }, 1000 * 10)
}
