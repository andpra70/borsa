import finnhub
import json
import datetime

def get_finnhub_data_with_library(symbol, api_key):
    """
    Scarica i dati storici di candele da Finnhub per un dato simbolo
    utilizzando la libreria finnhub-python.
    """
    try:
        finnhub_client = finnhub.Client(api_key=api_key)

        print(finnhub_client.stock_symbols('US'))
        print(finnhub_client.symbol_lookup(symbol))
        #print(finnhub_client.market_status(exchange='US'))
        #print(finnhub_client.market_holiday(exchange='US'))
        print(finnhub_client.company_profile(symbol=symbol))
        #print(finnhub_client.stock_insider_transactions(symbol, '2021-01-01', '2021-03-01'))
        print(finnhub_client.recommendation_trends(symbol))
        print(finnhub_client.stock_dividends(symbol=symbol, _from='2019-01-01', to='2020-01-01'))

            
    except Exception as e:
        print(f"Errore durante la richiesta API: {e}")
        return None

def save_to_json(data, filename):
    """
    Salva i dati in un file JSON.
    """
    try:
        with open(filename, 'w') as f:
            json.dump(data, f, indent=4)
        print(f"Dati salvati con successo in '{filename}'")
    except IOError as e:
        print(f"Errore durante il salvataggio del file JSON: {e}")

if __name__ == "__main__":
    # Sostituisci con la tua chiave API Finnhub
    FINNHUB_API_KEY = "d2rvr9pr01qv11lgg9bgd2rvr9pr01qv11lgg9c0"  
    
    # Simbolo del titolo che vuoi scaricare (es. Apple)
    STOCK_SYMBOL = "AAPL"

    if FINNHUB_API_KEY == "LA_TUA_CHIAVE_API_FINNHUB":
        print("ATTENZIONE: Inserisci la tua chiave API Finnhub. Puoi ottenerne una gratuitamente su finnhub.io")
    else:
        print(f"Scaricamento dati per {STOCK_SYMBOL} usando la libreria finnhub-python...")
        stock_data = get_finnhub_data_with_library(STOCK_SYMBOL, FINNHUB_API_KEY)

        if stock_data:
            output_filename = f"data/{STOCK_SYMBOL}_data_library.json"
            save_to_json(stock_data, output_filename)
        else:
            print("Impossibile recuperare i dati del titolo.")