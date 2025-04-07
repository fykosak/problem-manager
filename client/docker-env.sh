#!/bin/sh

# Script from https://pamalsahan.medium.com/dockerizing-a-react-application-injecting-environment-variables-at-build-vs-run-time-d74b6796fe38
# Replace build in vite variables with set docker env variables

for i in $(env | grep APP_)
do
    key=$(echo $i | cut -d '=' -f 1)
    value=$(echo $i | cut -d '=' -f 2-)
    echo $key=$value
    # sed All files
    # find /usr/share/nginx/html -type f -exec sed -i "s|${key}|${value}|g" '{}' +

    # sed JS and CSS only
    find /app/client/ -type f -name '*.js' -exec sed -i "s|${key}|${value}|g" '{}' +
done
echo 'done'
