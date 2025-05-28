#!/bin/sh

echo "[1/3] Generating Prisma client..."
npx prisma generate --schema=./src/prisma/schema.prisma

echo "[2/3] Building TypeScript..."
yarn build

echo "[3/3] Starting server..."
exec yarn start