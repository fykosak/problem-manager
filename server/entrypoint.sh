#!/bin/sh

set -e

# check required variables
if [ -z "$PUID" ]; then
	echo 'Environment variable $PUID not specified'
	exit 1
fi

if [ -z "$GUID" ]; then
	echo 'Environment variable $GUID not specified'
	exit 1
fi

# change IDs of default node user/group
groupmod --gid $GUID --non-unique node
echo "Group node switched to GID $GUID."
usermod --uid $PUID --gid $GUID node
echo "User node switched to UID $PUID."

echo "Starting cron"
crond -f &

echo "Starting server"
su -s '/bin/sh' -c "npx tsx src/index.ts" node
