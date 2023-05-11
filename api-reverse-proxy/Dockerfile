FROM openresty/openresty:alpine

RUN apk add --no-cache --allow-untrusted --repository http://dl-cdn.alpinelinux.org/alpine/v3.15/main perl
RUN apk add --no-cache --allow-untrusted --repository http://dl-cdn.alpinelinux.org/alpine/v3.15/main curl
RUN echo insecure >> ~/.curlrc
RUN opm get SkyLothar/lua-resty-jwt
