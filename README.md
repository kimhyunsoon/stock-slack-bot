![image](https://github.com/kimhyunsoon/stock-slack-bot/assets/60641694/ac3e4e56-789f-487d-839c-a1f918d19cff)

# stock-slack-bot
For a personal Slack notification server, some modifications are required to tailor it to individual preferences.

**Please refer on the database and web server:**[micro](https://github.com/kimhyunsoon/micro-builder) [micro-mongo](https://github.com/kimhyunsoon/micro-mongo)  

# Directory Structure
```
nfs
└──micro-file
   └──uploads
   └──logs
└──micro-nginx
   └──htdocs****
      │  "The frontend build artifacts are here."
   └──config
      │  nginx.conf
      │  default.conf
└──stock-slack-bot
   └──config
      │  config.json

workspace
│  "Please clone the git repository here."
```

# How to Apply
0. Please create the [Directory Structure](#directory-structure)
1. Git clone [micro-builder](https://github.com/kimhyunsoon/micro-builder) in `workspace`
2. Git clone [stock-slack-bot](https://github.com/kimhyunsoon/stock-slack-bot) in `workspace/stock-slack-bot`
3. Write `docker-compose.yml`:  
   Refer to [docker-compose.yml.sample](https://github.com/kimhyunsoon/micro-builder/blob/main/docker-compose.yml.sample)
4. Write `nginx.conf` and `default.conf` in `nfs/micro-nginx/config/`:  
   Refer to [nginx.conf.sample](https://github.com/kimhyunsoon/micro-builder/blob/main/nginx.conf.sample) and [default.conf.sample](https://github.com/kimhyunsoon/micro-builder/blob/main/default.conf.sample))
5. Write `config.json` in `nfs/stock-slack-bot/config/`:  
   Refer to [config.json.sample](https://github.com/kimhyunsoon/stock-slack-bot/config.json.sample)
6. Build `stock-slack-bot` and `micro-nginx`
   ```
   bash stock-slack-bot/build.sh
   bash micro-nginx/build.sh
   ```
7. Deploy Docker Swarn
   ```
   bash deploy.sh
   ```
