#!/bin/bash
set -e

sed -ri "s!^(\"useElastic\":).*!\1 '${elastic:enabled}'!" /webitel/client/config.js

exec /bin/true