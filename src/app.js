import fs      from 'fs'
import path    from 'path'
import only    from 'only'
import { pwrap, fiatFormatter } from './util'

const app    = require('express')()
    , items  = require('js-yaml').safeLoad(fs.readFileSync(process.env.ITEMS_PATH || 'items.yaml'))
    , charge = require('lightning-charge-client')(process.env.CHARGE_URL, process.env.CHARGE_TOKEN)

Object.keys(items).filter(k => !items[k].title).forEach(k => items[k].title = k)

app.set('port', process.env.PORT || 9116)
app.set('host', process.env.HOST || 'localhost')
app.set('title', process.env.TITLE || 'Lightning Nano POS')
app.set('currency', process.env.CURRENCY || 'BTC')
app.set('theme', process.env.THEME || 'yeti')
app.set('views', path.join(__dirname, '..', 'views'))
app.set('trust proxy', process.env.PROXIED || 'loopback')

app.set('custom_amount', !process.env.NO_CUSTOM)
app.set('show_bolt11', !!process.env.SHOW_BOLT11)

app.locals.formatFiat = fiatFormatter(app.settings.currency)

app.use(require('cookie-parser')())
app.use(require('body-parser').json())
app.use(require('body-parser').urlencoded({ extended: true }))

app.use(require('morgan')('dev'))
app.use(require('csurf')({ cookie: true }))

app.get('/', (req, res) => res.render('index.pug', { req, items }))

app.use('/bootswatch', require('express').static(path.resolve(require.resolve('bootswatch/package'), '..', 'dist')))

// use pre-compiled browserify bundle when available, or live-compile for dev
const compiledBundle = path.join(__dirname, 'client.bundle.min.js')
if (fs.existsSync(compiledBundle)) app.get('/script.js', (req, res) => res.sendFile(compiledBundle))
else app.get('/script.js', require('browserify-middleware')(require.resolve('./client')))

app.post('/invoice', pwrap(async (req, res) => {
  const item = req.body.item ? items[req.body.item]
             : app.enabled('custom_amount') ? { price: req.body.amount }
             : null

  if (!item) return res.sendStatus(404)

  const metadata = { source: 'nanopos', item: req.body.item }

  if (item.metadata) Object.assign(metadata, item.metadata)

  const inv = await charge.invoice({
    amount: item.price
  , currency: item.price ? app.settings.currency : null
  , description: `${ app.settings.title }${ item.title ? ': ' + item.title : '' }`
  , expiry: 599
  , metadata
  })
  res.send(only(inv, 'id payreq msatoshi quoted_currency quoted_amount expires_at'))
}))

app.get('/invoice/:invoice/wait', pwrap(async (req, res) => {
  const paid = await charge.wait(req.params.invoice, 100)
  res.sendStatus(paid === null ? 402 : paid ? 204 : 410)
}))

app.listen(app.settings.port, app.settings.host, _ =>
  console.log(`HTTP server running on ${ app.settings.host }:${ app.settings.port }`))
