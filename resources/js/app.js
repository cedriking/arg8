import '../css/app.css'

import './home/funds'
import './home/arconnect'
import { cleanMessage } from './utils/message'

$(() => {
  $('.tab-li')
    .find('a')
    .each((index, element) => {
      $(element).click(() => {
        cleanMessage()

        $('.tab-li').find('a').removeClass('active')
        $(element).addClass('active')
        $('.tab').removeClass('active')
        $('.tab').eq(index).addClass('active')
      })
    })

  // If url has hash, open tab with hash
  let hashClicked = false
  if (window.location.hash) {
    const hash = window.location.hash
    const a = $('.tab-li').find(`a[href="${hash}"]`)
    if (a.length) {
      a.click()
      hashClicked = true
    }
  }
  if (!hashClicked) {
    $('.tab-li').first().find('a').click()
  }
})
