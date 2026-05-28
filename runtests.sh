#!/bin/sh

. ./curltest.sh

require_jq    # These tests assume jq is installed

#dotenv    # load .env

PORT=${PORT:-8000}  # Use port 8000 unless PORT env var specified

default_content_type="application/json"
default_base_url="http://localhost:$PORT"

#default_verbose=1

#########################################################################

status "Testing Photos"

request "/photos" \
    -l "Posting a new photo for business $id" \
    -p '{"userid":0,"businessid":"'$id'","caption":"A nice photo"}' \
    --expect-code 201 \
    --expect-response '{"id":"[ANY]","links":{"photo":"[REGEX]/photos/.*","business":"[REGEX]/businesses/.*"}}'



