FROM nginx
MAINTAINER Vitaly Kovalyshyn "v.kovalyshyn@webitel.com"
ENV VERSION

RUN apt-get update \
    && apt-get install --no-install-recommends --no-install-suggests -y -q ca-certificates wget git \
    && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 https://github.com/letsencrypt/letsencrypt /opt/letsencrypt && mkdir /opt/letsencrypt/www

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/default-ssl.conf /etc/nginx/conf.d/default-ssl.template
COPY nginx/default-archive.conf /etc/nginx/conf.d/default-archive.template
COPY nginx/default-archive-ssl.conf /etc/nginx/conf.d/default-archive-ssl.template
COPY nginx/default-license.conf /etc/nginx/conf.d/default-license.template
COPY nginx/site.conf /opt/letsencrypt/www/site.conf
COPY enterpoint.sh /enterpoint.sh

COPY src /webitel/client
COPY widgets /webitel/widgets

ENTRYPOINT ["/enterpoint.sh"]
