#!/bin/sh

echo "Starting cron"
crond -f &

echo "Starting server"
npx tsx src/index.ts
