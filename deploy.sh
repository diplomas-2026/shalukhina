#!/bin/bash
set -e

SERVER=root@45.128.205.5
APP_NAME=shalukhina
API_DIR=./shalukhina-api
WEB_DIR=./shalukhina-web
DOMAIN=shalukhina.danbel.ru
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "Build ${APP_NAME}-api..."
cd "$API_DIR"
./gradlew build

echo "Copy jar to release..."
mkdir -p release
cp ./build/libs/shalukhina-api-0.0.1-SNAPSHOT.jar ./release/shalukhina-api-0.0.1-SNAPSHOT.jar

cd ..

echo "Build web..."
cd "$WEB_DIR"
npm run build
cd ..

echo "Git commit and push..."
git add .
git commit -m "update $TIMESTAMP" || echo "Nothing to commit"
git push

echo "Deploy backend on server..."
ssh $SERVER '
  set -e
  cd /opt/shalukhina
  git pull
  cd /opt
  docker compose up shalukhina-api -d --build
'

echo "Deploy frontend..."
ssh $SERVER "mkdir -p /var/www/projects/$DOMAIN && rm -rf /var/www/projects/$DOMAIN/*"
scp -r "$WEB_DIR/build/"* "$SERVER:/var/www/projects/$DOMAIN/"

echo "Done"
