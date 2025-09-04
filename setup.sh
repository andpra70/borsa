#!/bin/bash

conda init bash
conda install python=3.12.3
conda create --name scraper python=3.12.3 anaconda
source ~/.bashrc
conda activate scraper

#pip3 install -r requirements.txt
pip install flask_caching Flask Flask-Cors requests beautifulsoup4 flask_restx requests beautifulsoup4 pandas yfinance
pip freeze >requirements.txt
