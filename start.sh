#!/bin/bash
[ -f .env ] && source .env
babel-watch --extensions .js,.pug,.yaml --watch src --watch views --watch . --exclude node_modules src/cli.js -- "$@"
