#!/usr/bin/env bash

# Sync sources to HA installation for testing
# Requires entr to be installed (e.g. brew install entr)
echo ./media-browser-card.js | entr sh -c 'npm run build && scp ./dist/media-browser-card.js root@homeassistant:./config/www/'