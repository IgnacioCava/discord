#!/bin/bash
# container-up.sh

# default to 2 workers if not specified
SCALE=2

# parse something like workers=4
for arg in "$@"
do
  case $arg in
    workers=*)
    SCALE="${arg#*=}"
    shift
    ;;
  esac
done

docker-compose up --scale discord-worker="$SCALE"