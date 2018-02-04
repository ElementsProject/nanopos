require('babel-polyfill')

const qrcode = require('qrcode')
const payDialog = require('./views/payment.pug')
const paidDialog = require('./views/success.pug')

const csrf = $('meta[name=csrf]').attr('content')

$('[data-buy]').click(async e => {
  e.preventDefault()
  $('[data-buy]').prop('disabled', true)

  try {
    const inv  = await $.post('/invoice', { item: $(e.target).data('buy'), _csrf: csrf })
        , qr   = await qrcode.toDataURL(`lightning:${ inv.payreq }`.toUpperCase(), { margin: 0, width: 300 })
        , diag = $(payDialog({ ...inv, qr })).modal()

    updateExp(diag.find('[data-countdown-to]'))
    listen(inv.id, paid => (diag.modal('hide'), paid && success()))
  }
  finally {
    $('[data-buy]').attr('disabled', false)
  }
})

const listen = (invid, cb) => {
  const req = new XMLHttpRequest()
  req.addEventListener('load', ev =>
    ev.target.status === 204 ? cb(true)
  : ev.target.status === 410 ? cb(false)
  : ev.target.status === 402 ? listen(invid, cb) // long polling timed-out, re-poll immediately
  : setTimeout(poll, 10000)) // unknown response, re-poll after delay

  req.addEventListener('error', _ => setTimeout(_ => listen(invid, cb), 10000))
  req.open('GET', `/invoice/${ invid }/wait`)
  req.send()
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
