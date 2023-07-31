FROM arm64v8/node:18.16.0

RUN apt-get update

RUN npm install pm2 -g

RUN pm2 install typescript
RUN pm2 install pm2-logrotate

RUN pm2 set pm2-logrotate

COPY ./ /app/

WORKDIR /app

RUN mkdir -p /volume

RUN ln -s /volume/config /app/src/config
RUN ln -s /volume/uploads /app/uploads

RUN yarn install

ENTRYPOINT ["/bin/sh", "run.sh"]

EXPOSE 4000
