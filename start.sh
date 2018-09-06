#!/bin/bash
[ -f .env ] && source .env
babel-watch --extensions .js,.pug,.yaml --watch src --watch views --watch . src/cli.js $@
