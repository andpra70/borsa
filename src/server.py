import json
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_caching import Cache
from flask_restx import Api, Resource, fields
from dataclasses import asdict, dataclass
from typing import Optional
import random

from scraper_USD import USDEURScraperYF
from scraper_stockanalysis import StockAnalysisScraper
from scraper_yahoo import YahooFinanceScraper

app = Flask(__name__,
            static_url_path='', 
            static_folder='web/static',
            template_folder='web/templates')

cors = CORS(app, resources={
    r"/*":{
        "origins":"*"
    }
})

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

# Configurazione API con Swagger automatico
api = Api(
    app,
    version='1.0',
    title='API',
    description='REST API',
    doc='/swagger/',  # URL per la documentazione Swagger
    prefix='/api'
)

# Namespace per organizzare gli endpoints
ns_finanza = api.namespace('finanza', description='Operazioni di fin')

errore_model = api.model('Errore', {
    'success': fields.Boolean(description='Successo operazione'),
    'error': fields.String(description='Messaggio di errore')
})

health_model = api.model('Health', {
    'status': fields.String(description='Stato del servizio', example='ok'),
    'message': fields.String(description='Messaggio di stato', example='API REST Libro → Persona è attiva')
})


@dataclass
class Persona:
    nome: str
    cognome: str
    eta: int
    professione: str
    genere_preferito: str
    libri_letti: int
    email: str

@app.route('/pages/<path:path>')
def send_report(path):
    print(f"Serving page: {path}")
    # Using request args for path will expose you to directory traversal attacks
    return send_from_directory('pages', path)

@app.route('/hello/<name>')
def hello_name(name):
   return 'Hello %s!' % name

@ns_finanza.route('/ticker/<string:ticker>')
class Ticker(Resource):
    @cache.cached(timeout=30)
    def get(self,ticker):
        """Torna tiker info da Yahoo Finance"""
        print(f"🚀 Inizio scraping per {ticker}...")
        # Crea lo scraper
        scraper = YahooFinanceScraper(ticker, delay=1)
        return scraper.data.yf_ticker.info


@ns_finanza.route('/tickerSA/<string:ticker>')
class TickerSA(Resource):
    @cache.cached(timeout=60*15)
    def get(self,ticker):
        """Torna tiker info da SA Finance"""
        # Crea lo scraper
        scraper = StockAnalysisScraper(ticker, delay=0.3)
        # Esegue lo scraping
        print(f"🚀 Inizio scraping per {ticker}...")
        data = scraper.scrape_all()
        
        # Salva i dati in un file JSON
        filename = f"data/{ticker.lower()}_stockanalysis_data.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(asdict(data), f, indent=2, ensure_ascii=False, default=str)
        #json.dumps(asdict(data), indent=2, ensure_ascii=False, default=str)
            
        return asdict(data)


@ns_finanza.route('/usd/<string:ticker>')
class Ticker(Resource):
    def get(self,ticker):
        """Torna USD da Yahoo Finance EURUSD=X"""
        # Crea lo scraper
        scraper = USDEURScraperYF(ticker)
        return scraper.get_usd_eur_rate()


# Error handlers automatici
@api.errorhandler
def default_error_handler(error):
    """Gestore errori di default"""
    return {'success': False, 'error': str(error)}, getattr(error, 'code', 500)

if __name__ == '__main__':
    print("🚀 Avvio API REST")
    print("📚 Swagger UI disponibile su: http://localhost:5000/swagger/")
    print("💡 La documentazione Swagger viene generata automaticamente!")
    app.run(debug=True, host='0.0.0.0', port=5000)