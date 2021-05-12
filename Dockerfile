FROM nginx:1.16
MAINTAINER Vitaly Kovalyshyn "v.kovalyshyn@webitel.com"
ENV VERSION

RUN apt-get update \
    && apt-get install --no-install-recommends --no-install-suggests -y -q ca-certificates wget git certbot python-certbot-nginx \
    && rm -rf /var/lib/apt/lists/*

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/default-ssl.conf /etc/nginx/conf.d/default-ssl.template
COPY nginx/default-archive.conf /etc/nginx/conf.d/default-archive.template
COPY nginx/default-archive-ssl.conf /etc/nginx/conf.d/default-archive-ssl.template
COPY nginx/default-license.conf /etc/nginx/conf.d/default-license.template
COPY widgets /webitel/widgets
COPY src /webitel/client
COPY widgets/widget.client.js /webitel/client/modules/widget/widget.client.js
COPY phone-update /webitel/client/phone-update
COPY enterpoint.sh /enterpoint.sh

ENTRYPOINT ["/enterpoint.sh"]
