#!/bin/bash

# 스크립트 파일의 절대경로
path=$(readlink -f "$0")
# 서비스 명
service=$(basename "$(dirname "$path")")
# 버전 파일 (상위폴더.version)
version_file=$(dirname "$(dirname "$path")")/$service.version

# version 기본값=:latest
version="latest"
# 버전 파일 여부 확인
if [ -e $version_file ]; then
  version=$(cat $version_file)
  # 0.1 증가하여 버전 파일 업데이트
  version=$(awk -v ver="$version" 'BEGIN { printf "%.1f", ver + 0.1 }')
  echo $version > $version_file
  version=v$version
fi

# 서비스명으로 빌드
docker build --tag $service:$version $(dirname "$path")
