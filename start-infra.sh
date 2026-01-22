#!/bin/bash

# Start MongoDB locally
echo "Starting local MongoDB..."
./mongodb_server/bin/mongod --dbpath ./mongodb_data --port 27017 --fork --logpath ./mongodb.log

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to start..."
./mongosh_bin/bin/mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1
until [ $? -eq 0 ]; do
  sleep 2
  ./mongosh_bin/bin/mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1
done

# Initialize database
echo "Initializing database..."
cd database
../mongosh_bin/bin/mongosh < migrations/001_initial_setup.js
cd ..

echo "Infrastructure is ready!"
