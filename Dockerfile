FROM busybox
MAINTAINER Vitaly Kovalyshyn "v.kovalyshyn@webitel.com"

ENV VERSION

COPY src /webitel/client
COPY entrypoint.sh /webitel/

VOLUME ["/webitel/client"]
ENTRYPOINT ["/webitel/entrypoint.sh"]