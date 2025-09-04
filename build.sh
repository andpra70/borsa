#!/bin/bash

cd client
echo "Building client..."

echo "setup..."
./setup.sh

echo "Building client..."
./build.sh

echo "Building client done !"
