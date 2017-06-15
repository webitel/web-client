FROM nginx
MAINTAINER Vitaly Kovalyshyn "v.kovalyshyn@webitel.com"
ENV VERSION

RUN apt-get update \
    && apt-get install --no-install-recommends --no-install-suggests -y -q ca-certificates wget git \
    && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 https://github.com/letsencrypt/letsencrypt /opt/letsencrypt && mkdir /opt/letsencrypt/www

COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf
COPY default-ssl.conf /etc/nginx/conf.d/default-ssl.template
COPY default-archive.conf /etc/nginx/conf.d/default-archive.template
COPY default-archive-ssl.conf /etc/nginx/conf.d/default-archive-ssl.template
COPY site.conf /opt/letsencrypt/www/site.conf
COPY enterpoint.sh /enterpoint.sh

COPY src /webitel/client

ENTRYPOINT ["/enterpoint.sh"]
