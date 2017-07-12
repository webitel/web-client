#!/bin/bash
set -e
SSL="on"
ARCHIVE="on"

if [ "$WEBITEL_SSL" == "$SSL" ]; then
    echo "Start HTTPS"
    cp -rf /etc/nginx/conf.d/default-ssl.template /etc/nginx/conf.d/default.conf
fi

if [ "$WEBITEL_ARCHIVE" == "$ARCHIVE" ]; then
    echo "Start Archive Storage"
    cp -rf /etc/nginx/conf.d/default-archive.template /etc/nginx/conf.d/default.conf

    if [ "$WEBITEL_SSL" == "$SSL" ]; then
        echo "Start HTTPS with Archive Storage"
        cp -rf /etc/nginx/conf.d/default-archive-ssl.template /etc/nginx/conf.d/default.conf
    fi

fi

sed -i "s/\"useElastic\": true/\"useElastic\": $(printenv elastic:enabled)/" /webitel/client/config.js

if [ "$licenseManager" == "true" ]; then
    sed -i "s/\"enabled\": false/\"enabled\": $(printenv licenseManager)/" /webitel/client/config.js
#    cp -rf /etc/nginx/conf.d/default-license.template /etc/nginx/conf.d/default.conf
fi

if [ "$WEBITEL_HOST" ]; then
    sed -i "s/webitel.lo/${WEBITEL_HOST}/" /etc/nginx/conf.d/default.conf
    sed -i "s/webitel.lo/${WEBITEL_HOST}/" /opt/letsencrypt/www/site.conf
fi

nginx -g "daemon off;"
