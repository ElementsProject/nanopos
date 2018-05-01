import Currency from 'currency-formatter'

const pwrap = fn => (req, res, next) => fn(req, res).catch(next)

const fiatFormatter = currency => amount => Currency.format(amount, { code: currency.toUpperCase() })

module.exports = { pwrap, fiatFormatter }
