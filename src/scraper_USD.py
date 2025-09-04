import yfinance as yf

class USDEURScraperYF:
    """
    Una classe per ottenere la quotazione USD/EUR usando le API di yfinance.
    """
    def __init__(self, ticker_symbol="EUR=X"):
        """
        Inizializza lo scraper con il simbolo del ticker per la coppia di valute USD/EUR.
        Il simbolo "EUR=X" su Yahoo Finance rappresenta il tasso di cambio EUR/USD.
        Per ottenere USD/EUR, calcoleremo l'inverso.
        """
        self.ticker_symbol = ticker_symbol
        print(f"Inizializzazione con ticker: {self.ticker_symbol}")

    def get_usd_eur_rate(self):
        """
        Recupera e restituisce la quotazione USD/EUR attuale.
        """
        try:
            # Crea un oggetto Ticker per il simbolo EUR=X (EUR/USD)
            currency_ticker = yf.Ticker(self.ticker_symbol)

            # Ottiene i dati della quotazione in tempo reale (o il più recente disponibile)
            # using .info for current price or .history for historical data
            # For a single, most recent price, .info is often sufficient.
            info = currency_ticker.info
            
            # Yahoo Finance fornisce EUR/USD, quindi il campo 'regularMarketPrice' sarà il prezzo di 1 EUR in USD.
            # Esempio: Se EUR/USD è 1.08, significa che 1 EUR = 1.08 USD.
            # Vogliamo USD/EUR, quindi 1 USD = (1 / 1.08) EUR.
            
            eur_usd_rate = info.get('regularMarketPrice')

            if eur_usd_rate is None:
                print("Impossibile recuperare 'regularMarketPrice' dal ticker.")
                # Fallback: prova a usare il prezzo di chiusura dell'ultimo giorno disponibile
                hist = currency_ticker.history(period="1d")
                if not hist.empty:
                    eur_usd_rate = hist['Close'].iloc[-1]
                    print(f"Usato il prezzo di chiusura storico: {eur_usd_rate}")
                else:
                    print(f"Nessun dato storico disponibile per {self.ticker_symbol}.")
                    return None

            if eur_usd_rate:
                usd_eur_rate = 1 / eur_usd_rate
                return usd_eur_rate
            else:
                print(f"Non è stato possibile ottenere la quotazione EUR/USD per {self.ticker_symbol}.")
                return None

        except Exception as e:
            print(f"Errore durante il recupero della quotazione con yfinance: {e}")
            return None

# Esempio di utilizzo della classe
if __name__ == "__main__":
    scraper = USDEURScraperYF()
    rate = scraper.get_usd_eur_rate()

    if rate is not None:
        print(f"La quotazione attuale USD/EUR è: {rate:.4f}") # Formattato a 4 decimali
    else:
        print("Impossibile recuperare la quotazione USD/EUR.")

    print("\nVisualizzazione di una banconota da un dollaro americano:")
    
    print("\nVisualizzazione di una banconota da un euro:")
    