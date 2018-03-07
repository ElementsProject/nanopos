import fs     from 'fs'
import path   from 'path'
import only   from 'only'
import curfor from 'currency-formatter'
import { pwrap } from './util'

const app    = require('express')()
    , items  = require('js-yaml').safeLoad(fs.readFileSync(process.env.ITEMS_PATH || 'items.yaml'))
    , charge = require('lightning-charge-client')(process.env.CHARGE_URL, process.env.CHARGE_TOKEN)

Object.keys(items).filter(k => !items[k].title).forEach(k => items[k].title = k)

app.locals.formatFiat = amount => curfor.format(amount, { code: app.settings.currency.toUpperCase() })

app.set('port', process.env.PORT || 9116)
app.set('host', process.env.HOST || 'localhost')
app.set('title', process.env.TITLE || 'Lightning Nano PoS')
app.set('currency', process.env.CURRENCY || 'BTC')
app.set('views', path.join(__dirname, 'views'))
app.set('trust proxy', process.env.PROXIED || 'loopback')

app.use(require('cookie-parser')())
app.use(require('body-parser').json())
app.use(require('body-parser').urlencoded({ extended: true }))

app.use(require('morgan')('dev'))
app.use(require('csurf')({ cookie: true }))

app.use('/static', require('express').static(path.join(__dirname, 'www')))
app.get('/script.js', require('browserify-middleware')(__dirname+'/client.js'))

app.get('/', (req, res) => res.render('index.pug', { req, items }))

app.post('/invoice', pwrap(async (req, res) => {
  const item = req.body.item ? items[req.body.item] : { price: req.body.amount }
  if (!item) return res.sendStatus(404)

  const inv = await charge.invoice({
    amount: item.price
  , currency: item.price ? app.settings.currency : null
  , description: `${ app.settings.title }${ item ? ': ' + item.title : '' }`
  , expiry: 599
  , metadata: { item: req.body.item }
  })
  res.send(only(inv, 'id payreq msatoshi quoted_currency quoted_amount expires_at'))
}))

app.get('/invoice/:invoice/wait', pwrap(async (req, res) => {
  const paid = await charge.wait(req.params.invoice, 100)
  res.sendStatus(paid === null ? 402 : paid ? 204 : 410)
}))

app.listen(app.settings.port, app.settings.host, _ =>
  console.log(`HTTP server running on ${ app.settings.host }:${ app.settings.port }`))
