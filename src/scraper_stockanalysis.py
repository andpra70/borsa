import requests
from bs4 import BeautifulSoup
import json
import re
import time
import pandas as pd
from urllib.parse import urljoin, urlparse
from typing import Dict, List, Any
import logging
from dataclasses import dataclass, asdict
from datetime import datetime

# Configurazione logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ScrapedData:
    ticker: str
    company_name: str
    last_updated: str
    data: Dict[str, Any]

class StockAnalysisScraper:
    def __init__(self, ticker: str, delay: float = 1.0):
        self.ticker = ticker.upper()
        self.base_url = f"https://stockanalysis.com/stocks/{self.ticker.lower()}"
        self.delay = delay
        self.session = requests.Session()
        
        # Headers per simulare un browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        # URLs delle diverse sezioni
        self.urls = {
            'overview': f"{self.base_url}/",
            'statistics': f"{self.base_url}/statistics/",
            'financials': f"{self.base_url}/financials/",
            'balance-sheet': f"{self.base_url}/financials/balance-sheet/",
            'cash-flow': f"{self.base_url}/financials/cash-flow-statement/",
            'ratios': f"{self.base_url}/financials/ratios/",
            'revenue': f"{self.base_url}/revenue/",
            'earnings': f"{self.base_url}/earnings/",
            'dividend': f"{self.base_url}/dividend/",
            'forecast': f"{self.base_url}/forecast/",
            'news': f"{self.base_url}/news/"
        }
    
    def get_page(self, url: str) -> BeautifulSoup:
        """Ottiene una pagina e restituisce l'oggetto BeautifulSoup"""
        try:
            logger.info(f"Scraping: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            time.sleep(self.delay)
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            logger.error(f"Errore nel recuperare {url}: {e}")
            return None
    
    def clean_text(self, text: str) -> str:
        """Pulisce il testo rimuovendo caratteri indesiderati"""
        if not text:
            return ""
        return re.sub(r'\s+', ' ', text.strip())
    
    def parse_number(self, text: str) -> Any:
        """Converte stringhe numeriche in numeri"""
        if not text or text in ['-', 'N/A', 'n/a']:
            return None
        
        # Rimuove simboli e spazi
        clean_text = re.sub(r'[,$%()]', '', text.strip())
        
        # Gestisce numeri con suffissi (B, M, K)
        multipliers = {'K': 1000, 'M': 1000000, 'B': 1000000000, 'T': 1000000000000}
        
        for suffix, multiplier in multipliers.items():
            if clean_text.endswith(suffix):
                try:
                    return float(clean_text[:-1]) * multiplier
                except ValueError:
                    break
        
        # Prova a convertire in numero
        try:
            if '.' in clean_text:
                return float(clean_text)
            return int(clean_text)
        except ValueError:
            return text
    
    def scrape_table(self, soup: BeautifulSoup, table_selector: str = "table") -> List[Dict]:
        """Estrae dati da una tabella HTML"""
        tables = soup.select(table_selector)
        all_data = []
        
        for table in tables:
            headers = []
            rows_data = []
            
            # Estrae gli headers
            header_row = table.find('thead')
            if header_row:
                headers = [self.clean_text(th.get_text()) for th in header_row.find_all(['th', 'td'])]
            
            # Estrae le righe di dati
            tbody = table.find('tbody') or table
            for row in tbody.find_all('tr'):
                cells = row.find_all(['td', 'th'])
                if len(cells) > 0:
                    row_data = {}
                    for i, cell in enumerate(cells):
                        key = headers[i] if i < len(headers) else f"col_{i}"
                        value = self.clean_text(cell.get_text())
                        row_data[key] = self.parse_number(value)
                    if row_data:
                        rows_data.append(row_data)
            
            if rows_data:
                all_data.extend(rows_data)
        
        return all_data
    
    def scrape_key_statistics(self, soup: BeautifulSoup) -> Dict:
        """Estrae statistiche chiave dalla pagina"""
        stats = {}
        
        # Cerca tabelle con statistiche
        stat_tables = soup.select('table, .stats-table, .table')
        for table in stat_tables:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    key = self.clean_text(cells[0].get_text())
                    value = self.clean_text(cells[1].get_text())
                    if key and value:
                        stats[key] = self.parse_number(value)
        
        # Cerca div con statistiche
        stat_divs = soup.select('.stat, .metric, .data-point')
        for div in stat_divs:
            label = div.select_one('.label, .stat-label, .metric-label')
            value = div.select_one('.value, .stat-value, .metric-value')
            
            if label and value:
                key = self.clean_text(label.get_text())
                val = self.clean_text(value.get_text())
                if key and val:
                    stats[key] = self.parse_number(val)
        
        return stats
    
    def scrape_overview(self) -> Dict:
        """Scraping della pagina overview"""
        soup = self.get_page(self.urls['overview'])
        if not soup:
            return {}
        
        data = {
            'basic_info': {},
            'key_metrics': {},
            'price_data': {},
            'description': ''
        }
        
        # Informazioni di base
        company_name = soup.select_one('h1, .company-name, .ticker-name')
        if company_name:
            data['basic_info']['company_name'] = self.clean_text(company_name.get_text())
        
        # Prezzo corrente e variazioni
        price_elements = soup.select('.price, .current-price, .quote-price')
        for elem in price_elements:
            text = self.clean_text(elem.get_text())
            if '$' in text:
                data['price_data']['current_price'] = self.parse_number(text.replace('$', ''))
        
        # Estrae statistiche dalla pagina
        data['key_metrics'].update(self.scrape_key_statistics(soup))
        
        # Tabelle con dati
        tables_data = self.scrape_table(soup)
        if tables_data:
            data['tables'] = tables_data
        
        # Descrizione dell'azienda
        description = soup.select_one('.description, .company-description, .about')
        if description:
            data['description'] = self.clean_text(description.get_text())
        
        return data
    
    def scrape_financials(self) -> Dict:
        """Scraping delle pagine finanziarie"""
        financial_data = {}
        
        financial_pages = ['financials', 'balance-sheet', 'cash-flow', 'ratios']
        
        for page in financial_pages:
            soup = self.get_page(self.urls[page])
            if soup:
                page_data = {
                    'tables': self.scrape_table(soup),
                    'metrics': self.scrape_key_statistics(soup)
                }
                financial_data[page.replace('-', '_')] = page_data
        
        return financial_data
    
    def scrape_performance_data(self) -> Dict:
        """Scraping di dati su performance (revenue, earnings, dividend)"""
        performance_data = {}
        
        performance_pages = ['revenue', 'earnings', 'dividend']
        
        for page in performance_pages:
            soup = self.get_page(self.urls[page])
            if soup:
                page_data = {
                    'tables': self.scrape_table(soup),
                    'metrics': self.scrape_key_statistics(soup)
                }
                performance_data[page] = page_data
        
        return performance_data
    
    def scrape_forecast_and_analysis(self) -> Dict:
        """Scraping di previsioni e analisi"""
        analysis_data = {}
        
        analysis_pages = ['statistics', 'forecast']
        
        for page in analysis_pages:
            soup = self.get_page(self.urls[page])
            if soup:
                page_data = {
                    'tables': self.scrape_table(soup),
                    'metrics': self.scrape_key_statistics(soup)
                }
                analysis_data[page] = page_data
        
        return analysis_data
    
    def scrape_news(self) -> List[Dict]:
        """Scraping delle news"""
        soup = self.get_page(self.urls['news'])
        if not soup:
            return []
        
        news_data = []
        
        # Cerca articoli di news
        articles = soup.select('article, .news-item, .news-article, .post')
        
        for article in articles:
            news_item = {}
            
            # Titolo
            title = article.select_one('h1, h2, h3, .title, .headline')
            if title:
                news_item['title'] = self.clean_text(title.get_text())
            
            # Data
            date = article.select_one('.date, .published, .timestamp')
            if date:
                news_item['date'] = self.clean_text(date.get_text())
            
            # Link
            link = article.select_one('a')
            if link and link.get('href'):
                news_item['url'] = urljoin(self.base_url, link.get('href'))
            
            # Sommario
            summary = article.select_one('.summary, .excerpt, .description')
            if summary:
                news_item['summary'] = self.clean_text(summary.get_text())
            
            if news_item:
                news_data.append(news_item)
        
        return news_data
    
    def scrape_all(self) -> ScrapedData:
        """Scraping completo di tutti i dati"""
        logger.info(f"Inizio scraping completo per {self.ticker}")
        
        all_data = {
            'overview': {},
            'financials': {},
            'performance': {},
            'analysis': {},
            'news': []
        }
        
        try:
            # Overview
            logger.info("Scraping overview...")
            all_data['overview'] = self.scrape_overview()
            
            # Financials
            logger.info("Scraping financial data...")
            all_data['financials'] = self.scrape_financials()
            
            # Performance
            logger.info("Scraping performance data...")
            all_data['performance'] = self.scrape_performance_data()
            
            # Analysis
            logger.info("Scraping analysis data...")
            all_data['analysis'] = self.scrape_forecast_and_analysis()
            
            # News
            logger.info("Scraping news...")
            all_data['news'] = self.scrape_news()
            
            # Ottiene il nome dell'azienda
            company_name = self.ticker
            if all_data['overview'].get('basic_info', {}).get('company_name'):
                company_name = all_data['overview']['basic_info']['company_name']
            
            result = ScrapedData(
                ticker=self.ticker,
                company_name=company_name,
                last_updated=datetime.now().isoformat(),
                data=all_data
            )
            
            logger.info(f"Scraping completato per {self.ticker}")
            return result
            
        except Exception as e:
            logger.error(f"Errore durante lo scraping: {e}")
            raise

def main():
    """Funzione principale per testare lo scraper"""
    ticker = input("Inserisci il ticker (es. AAPL): ").strip().upper()
    
    if not ticker:
        print("Ticker non valido!")
        return
    
    try:
        # Crea lo scraper
        scraper = StockAnalysisScraper(ticker, delay=1.5)
        
        # Esegue lo scraping
        print(f"🚀 Inizio scraping per {ticker}...")
        data = scraper.scrape_all()
        
        # Salva i dati in un file JSON
        filename = f"data/{ticker.lower()}_stockanalysis_data.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(asdict(data), f, indent=2, ensure_ascii=False, default=str)
        
        print(f"✅ Dati salvati in {filename}")
        
        # Mostra un riepilogo
        total_items = 0
        for section, content in data.data.items():
            if isinstance(content, dict):
                total_items += len(content)
            elif isinstance(content, list):
                total_items += len(content)
        
        print(f"📊 Riepilogo scraping per {data.company_name} ({data.ticker}):")
        print(f"   • Sezioni estratte: {len(data.data)}")
        print(f"   • Elementi totali: {total_items}")
        print(f"   • Ultimo aggiornamento: {data.last_updated}")
        
        # Mostra anteprima della struttura
        print(f"📋 Struttura dati estratti:")
        for section, content in data.data.items():
            if isinstance(content, dict):
                print(f"   • {section}: {len(content)} sottosezioni")
            elif isinstance(content, list):
                print(f"   • {section}: {len(content)} elementi")
        
    except Exception as e:
        print(f"❌ Errore: {e}")

if __name__ == "__main__":
    main()