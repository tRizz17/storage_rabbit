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

image="./test.png"   # a real image you've added to the project
businessId="123"

request "/photos" \
    -l "Posting a new photo for business $businessId" \
    -f "businessId=$businessId" \
    -f "caption=A nice photo" \
    -f "image=@$image" \
    --expect-code 201 \
    --expect-response '{"id":"[ANY]","links":{"photo":"[REGEX]/photos/.*","business":"[REGEX]/businesses/.*"}}'



