import requests
from bs4 import BeautifulSoup
import json
import re
import time
import pandas as pd
from urllib.parse import urljoin, urlparse
from typing import Dict, List, Any, Optional
import logging
from dataclasses import dataclass, asdict
from datetime import datetime
import yfinance as yf

# Configurazione logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ScrapedData:
    ticker: str
    company_name: str
    last_updated: str
    yf_ticker: Optional[yf.Ticker] = None

class YahooFinanceScraper:
    def __init__(self, ticker: str, delay: float = 1.0):
        self.ticker=ticker
        print(f"🚀 Inizio scraping per {ticker} su Yahoo Finance...")
        # Inizializza yfinance per dati supplementari
        self.yf_ticker = yf.Ticker(self.ticker)
        self.data=ScrapedData(
            ticker=ticker,
            company_name=ticker,
            last_updated=datetime.now().isoformat(),
            yf_ticker=self.yf_ticker
        )

def main():
    """Funzione principale per testare lo scraper Yahoo Finance"""
    # ticker = input("Inserisci il ticker (es. AAPL, MSFT, GOOGL): ").strip().upper()
    ticker="AGNC"

    if not ticker:
        print("Ticker non valido!")
        return
    
    try:
        # Crea lo scraper
        scraper = YahooFinanceScraper(ticker, delay=0.1)
        
        # Salva i dati in un file JSON
        filename = f"data/{ticker.lower()}_yahoo_finance_data.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(scraper.data.yf_ticker.info, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"✅ Dati salvati in {filename}")
        
    except Exception as e:
        print(f"❌ Errore: {e}")

if __name__ == "__main__":
    main()