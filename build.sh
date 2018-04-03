#!/bin/bash
set -xeo pipefail

rm -rf dist/*

babel -d dist src

browserify src/client.js | uglifyjs -cm > dist/client.bundle.min.js
