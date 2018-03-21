# nanopos

A simple Lightning :zap: point-of-sale system with a clean & minimal web UI.

   * Optimized for places selling fixed-price items (like coffee shops, falafel stands or barber shops), but also has an option for billing custom amounts.
   * Small codebase (~60 server-side LoC + ~70 client-side LoC), great starting point for developing your own Lightning Charge apps!

Powered by :zap: [Lightning Charge](https://github.com/ElementsProject/lightning-charge).

## Setup

```bash
$ git clone https://github.com/shesek/nanopos && cd nanopos
$ npm install

$ cp items.yaml.example items.yaml # edit to set your items
$ cp env.example .env # edit to set configuration options (all are optional except for CHARGE_TOKEN)

$ npm start
```

## Example items file

```
tea:
  price: 0.02
  title: Green Tea # title is optional, defaults to the keys

coffee:
  price: 1

bamba:
  price: 3

beer:
  price: 7

hat:
  price: 15

tshirt:
  price: 25
```

## Example configuration file

```bash
export CHARGE_TOKEN=myAccessTokenForCharge
export CHARGE_URL=http://localhost:9112

export TITLE='Lightning Nano PoS'
export CURRENCY=USD
```

## Screenshots

<img src="https://i.imgur.com/puslYKb.png" width="45%"></img>
<img src="https://i.imgur.com/kScuEjG.png" width="45%"></img>

## License

MIT
