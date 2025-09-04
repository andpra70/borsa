#!/bin/bash

conda create --name scraper
conta activate scraper

pip install -U -r requirements.txt

pip install Flask Flask-Cors requests beautifulsoup4 flask_restx requests beautifulsoup4 pandas yfinance

pip3 freeze >requirements.txt
