FROM busybox
MAINTAINER Vitaly Kovalyshyn "v.kovalyshyn@webitel.com"

ENV VERSION

COPY src /webitel/client

VOLUME ["/webitel/client"]
ENTRYPOINT ["/bin/true"]