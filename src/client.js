require('babel-polyfill')

const $ = require('jquery')
    , B = require('bootstrap')
    , qrcode = require('qrcode')

const payDialog  = require('../views/payment.pug')
    , paidDialog = require('../views/success.pug')

const csrf = $('meta[name=csrf]').attr('content')

$('[data-buy-item]').click(e => {
  e.preventDefault()
  pay({ item: $(e.target).data('buy-item') })
})
$('[data-buy]').submit(e => {
  e.preventDefault()
  pay({ amount: $(e.target).find('[name=amount]').val() })
})

const pay = async data => {
  $('[data-buy-item], [data-buy] :input').prop('disabled', true)

  try {
    const inv  = await $.post('invoice', { ...data, _csrf: csrf })
        , qr   = await qrcode.toDataURL(`lightning:${ inv.payreq }`.toUpperCase(), { margin: 0, width: 300 })
        , diag = $(payDialog({ ...inv, qr })).modal()

    updateExp(diag.find('[data-countdown-to]'))

    const unlisten = listen(inv.id, paid => (diag.modal('hide'), paid && success()))
    diag.on('hidden.bs.modal', unlisten)
  }
  finally { $(':disabled').attr('disabled', false) }
}

const listen = (invid, cb) => {
  let retry = _ => listen(invid, cb)
  const req = $.get(`invoice/${ invid }/wait`)

  req.then(_ => cb(true))
    .catch(err =>
      err.status === 402 ? retry()   // long polling timed out, invoice is still payable
    : err.status === 410 ? cb(false) // invoice expired and can no longer be paid
    : err.statusText === 'abort' ? null // user aborted, do nothing
    : setTimeout(retry, 10000)) // unknown error, re-poll after delay

  return _ => (retry = _ => null, req.abort())
}

const success = _ => {
  const diag = $(paidDialog()).modal()
  setTimeout(_ => diag.modal('hide'), 5000)
}

const updateExp = el => {
  const left = +el.data('countdown-to') - (Date.now()/1000|0)
  if (left > 0) el.text(formatDur(left))
  else el.closest('.modal').modal('hide')
}

const formatDur = x => {
  const h=x/3600|0, m=x%3600/60|0, s=x%60
  return ''+(h>0?h+':':'')+(m<10&&h>0?'0':'')+m+':'+(s<10?'0':'')+s
}

setInterval(_ =>
  $('[data-countdown-to]').each((_, el) =>
    updateExp($(el)))
, 1000)

$(document).on('hidden.bs.modal', '.modal', e => $(e.target).remove())
