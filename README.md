![image](https://github.com/kimhyunsoon/micro-builder/assets/60641694/53ca8710-58da-4b68-9077-a52970b87f61)

# micro
Docker Stack with Nginx as a Reverse Proxy Server and TypeScript Node for Socket.IO and RESTful API and.

**This repository includes only TypeScript Node.:**[micro-node is here.](https://github.com/kimhyunsoon/micro-builder)  

# Directory Structure
```
nfs
└──micro-file
   └──uploads
   └──logs
└──micro-nginx
   └──htdocs
      │  "The frontend build artifacts are here."
   └──config
      │  nginx.conf
      │  default.conf
└──micro-node
   └──config
      │  config.json

workspace
│  "Please clone the git repository here."
```

# How to Apply
0. Please create the [Directory Structure](#directory-structure)
1. Git clone [micro-builder](https://github.com/kimhyunsoon/micro-builder) in `workspace`
2. Git clone [micro-node](https://github.com/kimhyunsoon/micro-node) in `workspace/micro-node`
3. Write `docker-compose.yml`:  
   Refer to [docker-compose.yml.sample](https://github.com/kimhyunsoon/micro-builder/blob/main/docker-compose.yml.sample)
4. Write `nginx.conf` and `default.conf` in `nfs/micro-nginx/config/`:  
   Refer to [nginx.conf.sample](https://github.com/kimhyunsoon/micro-builder/blob/main/nginx.conf.sample) and [default.conf.sample](https://github.com/kimhyunsoon/micro-builder/blob/main/default.conf.sample))
5. Write `config.json` in `nfs/micro-node/config/`:  
   Refer to [config.json.sample](https://github.com/kimhyunsoon/micro-node/config.json.sample)
6. Build `micro-node` and `micro-nginx`
   ```
   bash micro-node/build.sh
   bash micro-nginx/build.sh
   ```
7. Deploy Docker Swarn
   ```
   bash deploy.sh
   ```
