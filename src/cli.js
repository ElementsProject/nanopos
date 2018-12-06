#!/usr/bin/env node

const args = require('meow')(`
    Usage
      $ nanopos [options]

    Options
      -c, --charge-url <url>      lightning charge server url [default: http://localhost:9112]
      -t, --charge-token <token>  lightning charge access token [required]

      -y, --items-path <path>     path to yaml file with item config [default: ./items.yaml, file is required]
      -x, --currency <currency>   currency to use for item prices [default: BTC]
      -m, --theme <name>          pick theme from bootswatch.com [default: yeti]
      -l, --title <name>          website title [default: Lightning Nano POS]
      --no-custom                 disable custom amount field [default: false]
      --show-bolt11               display bolt11 as text and button [default: false]

      -p, --port <port>           http server port [default: 9115]
      -i, --host <host>           http server listen address [default: 127.0.0.1]
      -h, --help                  output usage information
      -v, --version               output version number

    Example
      $ nanopos -t chargeSecretToken -x EUR -y items.yaml

`, { flags: { chargeUrl: {alias:'c'}, chargeToken: {alias:'t'}
            , itemsPath: {alias:'y'}, currency: {alias:'x'}, theme: {alias:'m'}, title: {alias:'l'}
            , port: {alias:'p'}, host: {alias:'i'} } }
).flags

Object.keys(args).filter(k => k.length > 1)
  .map(k => [ k.replace(/([A-Z])/g, '_$1').toUpperCase(), args[k] ])
  .forEach(([ k, v ]) => v !== false ? process.env[k] = v
                                     : process.env[`NO_${k}`] = true)

process.env.NODE_ENV || (process.env.NODE_ENV = 'production')

require('babel-polyfill')
require('./app')
