#!/bin/bash

./build.sh &&

conda init 
source ~/.bashrc
conda activate scraper
python src/server.py 