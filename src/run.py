from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re
import datetime
from flasgger import Swagger

app = Flask(__name__)
CORS(app) # Abilita CORS per permettere richieste dal frontend
swagger = Swagger(app, template={
    "info": {
        "title": "Flask API",
        "description": "An example API using Flask and Swagger",
        "version": "1.0.0"
    }
})

# Questa è la mappatura ISIN -> Ticker. Ancora necessaria perché stockanalysis.com non cerca per ISIN.
isin_map = {
    "US0378331005": "AAPL",  # Apple
    "US5949181045": "MSFT",  # Microsoft
    "US0231351067": "AMZN",  # Amazon
    "US3696041013": "GOOG",  # Alphabet (Google)
    "US88160R1014": "TSLA",  # Tesla
    "DE000BASF111": "BASF", # BASF (esempio di titolo tedesco, il ticker su stockanalysis è spesso solo il nome)
    "IT0005238287": "ENI", # ENI (esempio di titolo italiano)
    "IE00B1FL5M68": "RYAAY", # Ryanair Holdings plc (ADR)
}

@app.route('/isin_to_ticker', methods=['GET'])
def isin_to_ticker_route():
    """
        This is an example endpoint that returns 'Hello, World!'
        ---
        responses:
            200:
                description: A successful response
                examples:
                    application/json: "Hello, World!"
    """
    isin = request.args.get('isin')
    if not isin:
        return jsonify({"error": "ISIN parameter is missing"}), 400

    ticker = isin_map.get(isin.upper())
    if not ticker:
        return jsonify({"error": f"ISIN {isin} not found or not mapped to a ticker for stockanalysis.com"}), 404
        
    return jsonify({"ticker": ticker})

@app.route('/stock_data_stockanalysis', methods=['GET'])
def get_stock_data_stockanalysis():
    ticker_symbol = request.args.get('ticker')
    if not ticker_symbol:
        return jsonify({"error": "Ticker symbol is missing"}), 400

    base_url = f"https://stockanalysis.com/stocks/{ticker_symbol.lower()}/"
    dividends_url = f"https://stockanalysis.com/stocks/{ticker_symbol.lower()}/dividends/"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        # --- Ottieni i dati generali e il prezzo corrente ---
        response = requests.get(base_url, headers=headers)
        response.raise_for_status() # Lancia un'eccezione per codici di stato HTTP errati
        soup = BeautifulSoup(response.text, 'html.parser')

        # Nome del titolo
        name_tag = soup.find('h1', class_='sa-p-name')
        long_name = name_tag.text.strip() if name_tag else ticker_symbol

        # Prezzo corrente
        price_tag = soup.find('span', class_='sps-price') # Potrebbe cambiare
        current_price_str = price_tag.text.strip().replace('$', '').replace(',', '') if price_tag else 'N/A'
        current_price = float(current_price_str) if current_price_str != 'N/A' else None

        # Valuta (StockAnalysis usa $ per USD, difficile determinare con certezza se non USD)
        currency = 'USD' # Assumiamo USD per la maggior parte dei titoli USA su stockanalysis

        # Info generali (settore, industria, paese - può essere più difficile da estrarre con affidabilità)
        # Queste informazioni sono spesso in tabelle o blocchi specifici, e il loro selettore può cambiare.
        sector = 'N/A'
        industry = 'N/A'
        country = 'N/A' # StockAnalysis non espone il paese così facilmente per la maggior parte dei titoli.

        # Cerchiamo blocchi di informazioni specifici, esempio per una card di overview
        info_blocks = soup.find_all('div', class_='sa-info-group')
        for block in info_blocks:
            label_tag = block.find('span', class_='sa-info-label')
            value_tag = block.find('span', class_='sa-info-value')
            if label_tag and value_tag:
                label = label_tag.text.strip()
                value = value_tag.text.strip()
                if "Sector" in label:
                    sector = value
                elif "Industry" in label:
                    industry = value
                # Aggiungi altri campi se li trovi nel HTML e ti servono


        # --- Ottieni i dati dei dividendi ---
        dividend_response = requests.get(dividends_url, headers=headers)
        dividend_response.raise_for_status()
        dividend_soup = BeautifulSoup(dividend_response.text, 'html.parser')

        dividend_per_share_annual = 0
        dividend_yield = 0
        ex_dividend_date = 'N/A'
        dividend_payment_date = 'N/A' # StockAnalysis non mostra direttamente la Payment Date per i dividendi

        # Dividendo annuale e yield (spesso in una card riassuntiva)
        # Selettori per queste informazioni sono molto specifici del layout di StockAnalysis
        # Questo è un esempio, potrebbe non essere preciso o stabile.
        dividend_info_blocks = dividend_soup.find_all('div', class_='sa-info-group')
        for block in dividend_info_blocks:
            label_tag = block.find('span', class_='sa-info-label')
            value_tag = block.find('span', class_='sa-info-value')
            if label_tag and value_tag:
                label = label_tag.text.strip()
                value = value_tag.text.strip()
                if "Dividend Yield" in label:
                    match = re.search(r'([\d.]+)%', value)
                    if match:
                        dividend_yield = float(match.group(1))
                elif "Annual Dividend" in label: # Potrebbe non essere sempre presente o con questo label
                     match = re.search(r'\$([\d.]+)', value)
                     if match:
                         dividend_per_share_annual = float(match.group(1))

        # Estrai la data ex-dividendo dalla tabella degli ultimi dividendi
        dividends_table = dividend_soup.find('table', class_='sa-table')
        if dividends_table:
            # Assumiamo che la prima riga del body (escludendo l'header) sia l'ultimo dividendo
            first_data_row = dividends_table.find('tbody').find('tr')
            if first_data_row:
                # Le colonne possono variare, dobbiamo identificarle
                # Ad esempio, Ex-Dividend Date è la colonna 2 o 3 (0-indexed)
                cells = first_data_row.find_all('td')
                if len(cells) > 2: # Assumiamo almeno 3 colonne
                    ex_dividend_date_str = cells[2].text.strip() # Tipicamente la terza colonna è Ex-Dividend
                    try:
                        # Converte in formato YYYY-MM-DD
                        ex_dividend_date = datetime.datetime.strptime(ex_dividend_date_str, '%b. %d, %Y').strftime('%Y-%m-%d')
                    except ValueError:
                        pass # La data non è nel formato atteso, lascia 'N/A'

        # Politica di distribuzione - non direttamente disponibile, è un'interpretazione
        distribution_policy = "Non disponibile tramite scraping diretto. Verificare pattern di pagamento."


        return jsonify({
            "ticker": ticker_symbol,
            "name": long_name,
            "current_price": current_price,
            "currency": currency,
            "yield_annual": dividend_yield, # Già in percentuale
            "dividend_per_share_annual": dividend_per_share_annual,
            "ex_dividend_date": ex_dividend_date,
            "dividend_payment_date": dividend_payment_date, # N/A come spiegato
            "sector": sector,
            "industry": industry,
            "country": country,
            "distribution_policy": distribution_policy,
        })

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return jsonify({"error": f"Ticker {ticker_symbol} not found on stockanalysis.com"}), 404
        app.logger.error(f"HTTP error fetching data for {ticker_symbol}: {e}")
        return jsonify({"error": f"HTTP error fetching data for {ticker_symbol}. Error: {str(e)}"}), 500
    except Exception as e:
        app.logger.error(f"Error scraping data for {ticker_symbol}: {e}")
        return jsonify({"error": f"Could not scrape data for {ticker_symbol}. Error: {str(e)}"}), 500

if __name__ == '__main__':
    print("Starting Flask server... http://127.0.0.1:5000/apidocs")
    app.run(debug=True, port=5000)