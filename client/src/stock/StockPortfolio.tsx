import React, { useState, useMemo,useEffect } from 'react';
import service from './Service'; // Assicurati che il percorso sia corretto
import StockInfo from './stockInfo';
import Usd from './usd';
import Clock from '../comp/clock';
import GridExample from '../comp/gridExample';

// Interfaccia per definire la struttura di un titolo
interface Stock {
  id: string;
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  data: any;
}

const StockPortfolio: React.FC = () => {

  var initial=service.load();

  const [stocks, setStocks] = useState<Stock[]>(initial);
  const [newStockSymbol, setNewStockSymbol] = useState<string>('');
  const [newStockQuantity, setNewStockQuantity] = useState<number>(1);
  const [newStockPurchasePrice, setNewStockPurchasePrice] = useState<number>(0);
  const [newStockCurrentPrice, setNewStockCurrentPrice] = useState<number>(0);

  // Funzione per generare un ID unico per ogni titolo
  const generateId = (): string => Math.random().toString(36).substr(2, 9);

  const onChangeSymbol = (value: string) => {
    setNewStockSymbol(value);
    console.log(value);
    service.fetchTicker(value)
      .then(data => {
          console.log('Dati ricevuti:', data);
          if (data && data.currentPrice) {
            setNewStockSymbol(value);
            setNewStockQuantity(1000);
            setNewStockPurchasePrice(data.currentPrice);
            setNewStockCurrentPrice(data.currentPrice);

          } else {
            console.warn('Dati non validi ricevuti dalla API');
          }
      })
      .catch(error => {
          setNewStockQuantity(0);
          setNewStockPurchasePrice(0);
          setNewStockCurrentPrice(0);
          console.error('Errore durante il fetch dei dati:', error);
      });
  }

  // Aggiunge un nuovo titolo al portafoglio
  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStockSymbol && newStockQuantity > 0 && newStockPurchasePrice >= 0 && newStockCurrentPrice >= 0) {
      const newStock: Stock = {
        id: generateId(),
        symbol: newStockSymbol.toUpperCase(),
        quantity: newStockQuantity,
        purchasePrice: newStockPurchasePrice,
        currentPrice: newStockCurrentPrice,
      };
      var stocks2=[...stocks, newStock];
      setStocks(stocks2);
      console.log('+ Stock '+newStock);
      service.store(stocks2);
      setNewStockSymbol('');
      setNewStockQuantity(0);
      setNewStockPurchasePrice(0);
      setNewStockCurrentPrice(0);
    } else {
      alert('Si prega di inserire valori validi per il titolo.');
    }
  };

  // Rimuove un titolo dal portafoglio
  const handleRemoveStock = (id: string) => {
    var stocks2=stocks.filter((stock) => stock.id !== id)
    setStocks(stocks2);
    console.log('- Stock '+id);
    service.store(stocks2);
  };

  // Aggiorna il prezzo corrente di un titolo (simulazione)
  const handleUpdateCurrentPrice = (id: string, newPrice: number) => {
    setStocks(
      stocks.map((stock) =>
        stock.id === id ? { ...stock, currentPrice: newPrice } : stock
      )
    );
  };


  const aggiornaValori=()=>{
    console.log('Aggiornamento prezzi correnti...');
    stocks.forEach((stock) => {
      service.fetchTicker(stock.symbol)
        .then(data => {
            console.log('Dati ricevuti:', data);
            if (data && data.currentPrice) {
              handleUpdateCurrentPrice(stock.id, data.currentPrice);
              calculateProfitLoss(stock);
            } else {
              console.warn('Dati non validi ricevuti dalla API');
            }
        }); 
    });
    setStocks(stocks);
  }


  useEffect(() => {
    console.log('mounting');
    console.log('Stato attuale del portafoglio:', stocks);
    
    const interval = setInterval(() => {
      aggiornaValori();
    },5000);

    return () => {
      console.log('unmounting, clear interval');
      clearInterval(interval); 
    }
  }, [stocks]);

  // Calcola il valore totale del portafoglio
  const totalPurchaseValue = useMemo(() => {
    return stocks.reduce((total, stock) => total + stock.quantity * stock.purchasePrice, 0);
  }, [stocks]);

  const totalPortfolioValue = useMemo(() => {
    return stocks.reduce((total, stock) => total + stock.quantity * stock.currentPrice, 0);
  }, [stocks]);

  // Calcola il profitto/perdita per ogni titolo
  const calculateProfitLoss = (stock: Stock) => {
    return (stock.currentPrice - stock.purchasePrice) * stock.quantity;
  };

  var pl=totalPortfolioValue-totalPurchaseValue
  var stockUrl='https://stockanalysis.com/stocks/';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '2px', margin: 'auto' }}>
      <h1>Portafoglio</h1>
      <Clock /><Usd />

      <GridExample />


      <a href="https://stockanalysis.com/watchlist/" target="_blank" rel="noopener noreferrer"> Watchlist </a>
      <a href="https://www.portfoliovisualizer.com/monte-carlo-simulation#analysisResults" target="_blank" rel="noopener noreferrer"> Analisys </a>


      {/* Form per aggiungere nuovi titoli */}
      <form onSubmit={handleAddStock} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
        <h2>Aggiungi Nuovo Titolo</h2>
        <div style={{ marginBottom: '10px' }} className="mb1">
          <label htmlFor="symbol" style={{ display: 'block', marginBottom: '5px' }}>Simbolo:</label>
          <input
            type="text"
            id="symbol"
            value={newStockSymbol}
            onChange={(e) => onChangeSymbol(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="quantity" style={{ display: 'block', marginBottom: '5px' }}>Quantità:</label>
          <input
            type="number"
            id="quantity"
            value={newStockQuantity}
            onChange={(e) => setNewStockQuantity(parseInt(e.target.value))}
            min="1"
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="purchasePrice" style={{ display: 'block', marginBottom: '5px' }}>Prezzo di Acquisto:</label>
          <input
            type="number"
            id="purchasePrice"
            value={newStockPurchasePrice}
            onChange={(e) => setNewStockPurchasePrice(parseFloat(e.target.value))}
            step="0.0001"
            min="0"
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="currentPrice" style={{ display: 'block', marginBottom: '5px' }}>Prezzo Corrente:</label>
          <input
            type="number"
            id="currentPrice"
            value={newStockCurrentPrice}
            onChange={(e) => setNewStockCurrentPrice(parseFloat(e.target.value))}
            step="0.0001"
            min="0"
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Aggiungi Titolo</button>
      </form>

      {/* Elenco dei titoli nel portafoglio */}
      <h2>Titoli nel Portafoglio</h2>
      {stocks.length === 0 ? (
        <p>Il tuo portafoglio è vuoto. Aggiungi alcuni titoli!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e0e0e0' }}>
              <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Simbolo</th>
              <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Quantità</th>
              <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Acquisto</th>
              <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Corrente</th>
              <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Valore Carico</th>
              <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Valore Totale</th>
              <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>P/L</th>
              <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr key={stock.id}>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                  <a href={ stockUrl+stock.symbol } target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none' }}>
                  {stock.symbol}
                  <StockInfo ticker={stock.symbol} />
                  </a>
                </td>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                  {stock.quantity}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                  {stock.purchasePrice.toFixed(4)}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                  {stock.currentPrice.toFixed(4)}                  
                </td>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                  {(stock.quantity * stock.purchasePrice).toFixed(4)}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                  {(stock.quantity * stock.currentPrice).toFixed(4)}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ccc', color: calculateProfitLoss(stock) >= 0 ? 'green' : 'red' }}>
                  {calculateProfitLoss(stock).toFixed(4)}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                  <button onClick={() => handleRemoveStock(stock.id)} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Rimuovi</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Riepilogo del portafoglio */}
      <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #007bff', borderRadius: '5px', backgroundColor: '#e6f7ff' }}>
        <h2>Riepilogo Portafoglio</h2>
        <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>Valore Totale del Portafoglio: €{totalPortfolioValue.toFixed(2)}</p>
        <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>Valore Totale del carico: €{totalPurchaseValue.toFixed(2)}</p>
        <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>P/L totale del carico: €{pl.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default StockPortfolio;

