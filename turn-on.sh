#!/bin/bash  
export $(cat .env | xargs)  
docker run -e PORT -e TOKEN_VALIDATION_URL -p $PORT:3000 whatsapp-web

# before run this: chmod +x start.sh
# to run: ./turn-on.sh