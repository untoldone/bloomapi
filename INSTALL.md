# Dependencies

## Ubuntu

sudo add-apt-repository -y ppa:chris-lea/node.js 

sudo apt-get update

sudo apt-get install git-core postgresql postgresql-client postgresql-contrib libpq-dev p7zip nodejs npm p7zip-full poppler-utils g++ make software-properties-common

npm config set registry http://registry.npmjs.org/

# Start

## Postgres

sudo /etc/init.d/postgresql start

### Create Postgres user

sudo -u postgres createuser -s -P -e bloomapi

### Create BloomAPI database

sudo su postgres -c "psql -c 'CREATE DATABASE bloomapi'"

# Bootstrap

npm install

node make bootstrap

# Geocoding
 
./node_modules/db-migrate/bin/db-migrate up --config database.json -e development

API_KEY=<your_mapquest_api> node make geocode