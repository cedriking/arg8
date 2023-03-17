export async function showMessage(msg, isError = false) {
  if (isError) {
    msg = `<span class="text-danger"><i class="fa fa-solid fa-exclamation-circle"></i> Error:</span> ${msg}`
  } else {
    msg = `<span class="text-success"><i class="fa fa-solid fa-check-circle"></i></span> ${msg}`
  }

  $('.node-response').children('span').html(msg).addClass('fadeIn')

  $('.fund-button').text('Fund')
  $('.fund-button, .fund-input').removeAttr('disabled')
}

export async function cleanMessage() {
  $('.node-response').children('span').html('&nbsp;').removeClass('fadeIn')
}
