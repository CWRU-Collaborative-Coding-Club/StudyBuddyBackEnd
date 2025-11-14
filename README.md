export FIREBASE_SERVICE_ACCOUNT_JSON=$(cat ./service-account.json | jq -c .)

npm install

npm run start
