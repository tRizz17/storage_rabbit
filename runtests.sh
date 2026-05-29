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

image="./test.png"
businessId="123"

request "/photos" \
    -l "Posting a new photo for business $businessId" \
    -f "businessId=$businessId" \
    -f "caption=A nice photo" \
    -f "image=@$image" \
    --expect-code 201 \
    --expect-response '{"id":"[ANY]","links":{"photo":"[REGEX]/photos/.*","business":"[REGEX]/businesses/.*"}}'

photoId=$(extract_field id)

request "/photos/$photoId" \
    -l "Getting photo by id with $photoId" \
    --expect-code 200 \
    --expect-response '{
        "_id": "'$photoId'", 
        "url": "/media/photos/'$photoId'",
        "thumbUrl": "/media/thumbs/'$photoId'",
        "contentType": "image/png",
        "businessId": "'$businessId'",
        "thumbId": "[ANY]"
    }'

url=$(extract_field url)
thumbUrl=$(extract_field thumbUrl)

request "$url" \
    -l "Testing the url for /media/photos/:id" \
    --expect-code 200 \

sleep 5 # Give the consumer a bit of time before the request
request "$thumbUrl" \
    -l "Testing the url for /media/thumbs/:id" \
    --expect-code 200 \

