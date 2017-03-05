#!/bin/sh


#create service registry based on consul server

export GOOGLE_APPLICATION_CREDENTIALS=/Users/diasc/code/nodejs/trackit-1a3f903ab540.json

echo "Create Docker machine for Consul"
echo 
echo

docker-machine create --driver google --google-project trackit-154823 --google-zone europe-west1-b --google-machine-type n1-standard-1 consul

export KV_IP=$(docker-machine ssh consul 'ifconfig ens4 | grep "inet addr" | cut -f 2 -d : | cut -d" " -f1')

echo "Consul IP --->" ${KV_IP}

echo 
echo

eval $(docker-machine env consul)

docker run -d -h consul -p ${KV_IP}:8500:8500 --restart always gliderlabs/consul-server -bootstrap

echo "Create Docker machine for Master"

echo 
echo

docker-machine create --driver google --google-project trackit-154823 --google-zone europe-west1-b --google-machine-type n1-standard-1 --swarm --swarm-master --swarm-discovery="consul://${KV_IP}:8500" --engine-opt="cluster-store=consul://${KV_IP}:8500" --engine-opt="cluster-advertise=ens4:2376" master

export MASTER_IP=$(docker-machine ssh master 'ifconfig ens4 | grep "inet addr" | cut -f 2 -d : | cut -d" " -f1')

echo "MASTER IP --->"  $MASTER_IP

echo 
echo

echo "Create Docker machine for Slave"

echo 
echo

docker-machine create --driver google --google-project trackit-154823  --google-zone europe-west1-b --google-machine-type n1-standard-1 --swarm --swarm-discovery="consul://${KV_IP}:8500" --engine-opt="cluster-store=consul://${KV_IP}:8500" --engine-opt="cluster-advertise=ens4:2376" slave


export SLAVE_IP=$(docker-machine ssh slave 'ifconfig ens4 | grep "inet addr" | cut -f 2 -d : | cut -d" " -f1')

echo "SLAVE IP --->" ${SLAVE_IP} 

echo 
echo

eval $(docker-machine env master)

docker run -d --name=registrator -h ${MASTER_IP} --volume=/var/run/docker.sock:/tmp/docker.sock gliderlabs/registrator:lastest consul://${KV_IP}:8500

eval $(docker-machine env slave)

docker run -d --name=registrator -h ${SLAVE_IP} --volume=/var/run/docker.sock:/tmp/docker.sock gliderlabs/registrator consul://${KV_IP}:8500

eval $(docker-machine env -swarm master)

echo "Machines running --->"

echo 
echo

docker-machine ls

docker-compose -f app-docker-compose.yaml build;docker-compose -f app-docker-compose.yaml up
