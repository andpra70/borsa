import React, { useState, useMemo, useEffect } from 'react';
import service from './Service'; // Assicurati che il percorso sia corretto
import StockInfo from './stockInfo';
import Usd from './usd';
import Clock from '../comp/clock';
import GridComponent, { ColumnConfig } from '../comp/grid';

// Interfaccia per definire la struttura di un titolo
interface Stock {
  id: string;
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  data: any;
}

const StockEdit: React.FC = () => {

  var initial = service.load();

  const [usd, setUsd] = useState(0);
  const [loading, setLoading] = useState(false);
  const [curData, setCurData] = useState({});
  const [stocks, setStocks] = useState<Stock[]>(initial);
  const [newStockSymbol, setNewStockSymbol] = useState<string>('');
  const [newStockQuantity, setNewStockQuantity] = useState<number>(1);
  const [newStockPurchasePrice, setNewStockPurchasePrice] = useState<number>(0);
  const [newStockCurrentPrice, setNewStockCurrentPrice] = useState<number>(0);

  const stockConfiguration: ColumnConfig<Stock>[] = [
    //  { header: 'ID', path: 'id', sortable: true, type: 'string' },
    {
      header: 'Symbol', path: 'symbol', sortable: true, type: 'string', render: (item) => {
        return <div>
          <a href={'https://stockanalysis.com/stocks/' + item.symbol} target="_blank">{item.symbol}</a>
        </div>
      }
    },
    { header: 'Nome Azienda', path: 'data.shortName', sortable: true, type: 'string'},
    { header: 'Settore', path: 'data.industryDisp', sortable: true, type: 'string' },
    {
      header: 'quantity (E)', path: 'quantity', sortable: true, type: 'number', render: (item) => {
        return <div>
          <input type="text" style={{width:'70px'}} value={item.quantity} onChange={(e) => { setItemQuantity(item, e.target.value); }} />
        </div>
      }
    },
    { header: 'Price Target', path: 'data._data.data.overview.key_metrics.Price Target', sortable: true, type: 'string' },
    { header: 'Prezzo Carico (E)', path: 'purchasePrice', sortable: true, type: 'number' ,render: (item) => {
        return <div>
          <input type="text" style={{width:'70px'}} value={item.purchasePrice} onChange={(e) => { setItemPrezzoCarico(item, e.target.value); }} />
        </div>
      }
    },
    { header: 'Prezzo Corrente', path: 'currentPrice', sortable: true, type: 'number' },
    {
      header: 'Valore Carico', path: 'VC', sortable: true, type: 'number', render: (item) => {
        const pe = (item.purchasePrice) * item.quantity;
        return `${pe.toFixed(2)}$ ${(pe/usd).toFixed(2)}E`;
      }
    },
    {
      header: 'Valore Corrente', path: 'Corrente', sortable: true, type: 'number', render: (item) => {
        const pe = (item.currentPrice) * item.quantity;
        return `${pe.toFixed(2)}S ${(pe/usd).toFixed(2)}E`;
      }
    },
    {
      header: 'P/E', path: 'P/E', sortable: false, type: 'number', render: (item) => {
        const pe = (item.currentPrice - item.purchasePrice) * item.quantity;
        const color = pe >= 0 ? 'green' : 'red';
        return <p style={{ color: color }}>{pe.toFixed(2)}$ {(pe/usd).toFixed(2)}E </p>;
      }
    },
    { header: 'Div', path: 'data.lastDividendValue', sortable: true, type: 'cash' },
    {
      header: 'Mensile', path: 'Mensile', sortable: true, type: 'number', render: (item) => {
        const v = (item.data.lastDividendValue) * item.quantity;
        const vNoTaxUsa = v * 0.85; // Supponiamo una ritenuta del 15% per i dividendi USA
        const vNoTaxIta = (vNoTaxUsa/usd) * 0.74; // Supponiamo una ritenuta del 26% per i dividendi ITA
        return <p>{v.toFixed(2)}$/{vNoTaxUsa.toFixed(2)}$ {(vNoTaxUsa/usd).toFixed(2)}E/{(vNoTaxIta).toFixed(2)}E</p>;
      }
    },
    { header: 'Data Dividendo', path: 'data._data.data.overview.key_metrics.Ex-Dividend Date', sortable: true, type: 'string' },
    { header: 'Analysts', path: 'data._data.data.overview.key_metrics.Analysts', sortable: true, type: 'string',render: (item) => {
        const v = item.data._data.data.overview.key_metrics.Analysts;
        var color='black';
        switch(v) {
          case 'Strong Buy': color='green'; break;
          case 'Buy': color='lightgreen'; break;
          case 'Hold': color='orange'; break;
          case 'Underperform': color='red'; break;
          case 'Sell': color='darkred'; break;
        }
        return <p style={{backgroundColor:color}}>{v}</p>;
      }
    },
    { header: 'Open', path: 'data._data.data.overview.key_metrics.Open', sortable: true, type: 'number' },
    { header: 'Prev.Close', path: 'data._data.data.overview.key_metrics.Previous Close', sortable: true, type: 'number' }
  ];

  // Funzione per generare un ID unico per ogni titolo
  const generateId = (): string => Math.random().toString(36).substr(2, 9);

  const setItemQuantity = (item, quantity: number) => {
    setStocks(
      stocks.map((stock) =>
        stock.id === item.id ? { ...stock, quantity: quantity } : stock
      )
    );
  }
  const setItemPrezzoCarico = (item, pc: number) => {
    setStocks(
      stocks.map((stock) =>
        stock.id === item.id ? { ...stock, purchasePrice: pc } : stock
      )
    );
  }

  // Gestisce il cambiamento del simbolo del titolo e fetch i dati dalla API
  const onChangeSymbol = (value: string) => {
    setNewStockSymbol(value);
    console.log(value);
    setLoading(true);
    service.fetchTicker(value)
      .then(data => {
        setLoading(false);
        console.log('Dati ricevuti:', data);
        if (data && data.currentPrice) {
          setNewStockSymbol(value);
          setNewStockQuantity(1000);
          setNewStockPurchasePrice(data.currentPrice);
          setNewStockCurrentPrice(data.currentPrice);
          setCurData(data);
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
        data: curData
      };
      var stocks2 = [...stocks, newStock];
      setStocks(stocks2);
      console.log('+ Stock ' + newStock);
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
    var stocks2 = stocks.filter((stock) => stock.id !== id)
    setStocks(stocks2);
    console.log('- Stock ' + id);
    service.store(stocks2);
  };

  // Aggiorna il prezzo corrente di un titolo
  const handleUpdateCurrentPrice = (id: string, newPrice: number) => {
    setStocks(
      stocks.map((stock) =>
        stock.id === id ? { ...stock, currentPrice: newPrice } : stock
      )
    );
  };


  const aggiornaValori = () => {
    console.log('Aggiornamento prezzi correnti...');
    setLoading(true);
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
    setLoading(false);
    setStocks(stocks);
  }


  useEffect(() => {
    console.log('mounting');
    console.log('Stato attuale del portafoglio:', stocks);

    const interval = setInterval(() => {
      aggiornaValori();
    }, 100000);

    return () => {
      console.log('unmounting, clear interval');
      clearInterval(interval);
    }
  }, [stocks]);

  // Calcola il valore totale del portafoglio
  const totalPurchaseValue = useMemo(() => {
    return stocks.reduce((total, stock) => total + stock.quantity * stock.purchasePrice, 0);
  }, [stocks]);

  // Calcola il div mensile del portafoglio
  const totalDividendValue = useMemo(() => {
    var ret=stocks.reduce((total, stock) => total + stock.quantity * stock.data.lastDividendValue, 0);
    console.log('Total Dividend Value:', ret);
    return ret;
  }, [stocks]);

  const totalPortfolioValue = useMemo(() => {
    return stocks.reduce((total, stock) => total + stock.quantity * stock.currentPrice, 0);
  }, [stocks]);

  // Calcola il profitto/perdita per ogni titolo
  const calculateProfitLoss = (stock: Stock) => {
    return (stock.currentPrice - stock.purchasePrice) * stock.quantity;
  };

  const handleRemoveCompany = (index: number, company: Stock) => {
    console.log(`Rimuovi azienda: ${company.id} all'indice ${index}`);
    handleRemoveStock(company.id);
    // Filtra l'array per rimuovere l'elemento
    // setSCompanies(prevCompanies => prevCompanies.filter((_, i) => i !== index));
  };

  const handleSelectCompany = (index: number, company: Stock) => {
    console.log(`Select azienda: ${company.id} all'indice ${index}`);
    window.open('https://stockanalysis.com/stocks/' + company.symbol, '_blank');
    // Filtra l'array per rimuovere l'elemento
    // setSCompanies(prevCompanies => prevCompanies.filter((_, i) => i !== index));
  };

  const pl = totalPortfolioValue - totalPurchaseValue;
  const a=totalDividendValue;
  const totalPortfolioValueEur= totalPortfolioValue/usd;
  const totalPurchaseValueEur= totalPurchaseValue/usd;
  const totalChangeLossEur= (totalPurchaseValueEur-totalPortfolioValueEur)/usd;
  const divUSA= totalDividendValue*0.85;
  const divITA= (divUSA/usd);
  const divITANetto= divITA*0.74;
  const yeld= (totalDividendValue*12)/totalPortfolioValue*100;
  const yeldUSA= (divUSA*12)/totalPortfolioValue*100;
  const yeldITA= (divITA*12)/(totalPortfolioValue/usd)*100;
  const yeldITANetto= (divITANetto*12)/(totalPortfolioValue/usd)*100;

  service.fetchUSD('USDEUR=X').then(data => {
    setUsd(data);
  });

  return (
    <div class="container-fluid" >
      <h1>Portafoglio <Clock /><Usd /></h1>

      <a href="https://stockanalysis.com/watchlist/" target="_blank" rel="noopener noreferrer"> Watchlist </a>
      <a href="https://www.portfoliovisualizer.com/monte-carlo-simulation#analysisResults" target="_blank" rel="noopener noreferrer"> Analisys </a>


      {/* Form per aggiungere nuovi titoli */}
      {loading && <div>Loading...</div>}
      
      {!loading && 
      <form class="form-group" disabled={loading} onSubmit={handleAddStock} >
        <h2>Titolo {loading && <div>Loading...</div>}</h2>
        <div >
          <label class="col-md-2" htmlFor="symbol">Simbolo:</label>
          <input
            class="form-control-sm"
            type="text"
            id="symbol"
            value={newStockSymbol}
            onChange={(e) => setNewStockSymbol(e.target.value)}
            required
          />
          <button type="button" class="btn btn-success" onClick={() => onChangeSymbol(newStockSymbol)} >Fetch</button>
        </div>
        <div >
          <label class="col-md-2" htmlFor="quantity">Quantità:</label>
          <input
            class="form-control-sm"
            type="number"
            id="quantity"
            value={newStockQuantity}
            onChange={(e) => setNewStockQuantity(parseInt(e.target.value))}
            min="1"
            required
          />
        </div>
        <div >
          <label class="col-md-2" htmlFor="purchasePrice">Prezzo di Acquisto:</label>
          <input
            class="form-control-sm"
            type="number"
            id="purchasePrice"
            value={newStockPurchasePrice}
            onChange={(e) => setNewStockPurchasePrice(parseFloat(e.target.value))}
            step="0.0001"
            min="0"
            required
          />
        </div>
        <div >
          <label class="col-md-2" htmlFor="currentPrice">Prezzo Corrente:</label>
          <input
            class="form-control-sm"
            type="number"
            id="currentPrice"
            value={newStockCurrentPrice}
            onChange={(e) => setNewStockCurrentPrice(parseFloat(e.target.value))}
            step="0.0001"
            min="0"
            required
          />
        </div>
     

        <div class="container-fluid">
          <div class="row">
            <div class="col-sm"></div>
            <button type="submit" class="btn btn-primary">Aggiungi Titolo</button>
          </div>
        </div>
      </form>
    }

      {/* Elenco dei titoli nel portafoglio */}
      <h2>Portafoglio</h2>
      <GridComponent
        dataSet={stocks}
        configuration={stockConfiguration}
        onRemove={handleRemoveCompany}
        onSelect={handleSelectCompany}
      />

      {/* Riepilogo del portafoglio */
      
      }
      <div class="container-fluid" >
        <p >Valore Totale del Portafoglio: {totalPortfolioValue.toFixed(2)}$ = {(totalPortfolioValueEur).toFixed(2)} Eur</p>
        <p >Valore Totale del carico: {totalPurchaseValue.toFixed(2)}$ = {(totalPurchaseValue/usd).toFixed(2)} Eur</p>
        <p >Valore Totale dividendo mensile: {totalDividendValue.toFixed(2)}$/{divUSA.toFixed(2)}$ = {divITA.toFixed(2)} Eur/{divITANetto.toFixed(2)} Eur</p>
        <p >Rendimento: USA:{yeld.toFixed(2)}% - USA netto={yeldUSA.toFixed(2)}%  ITA={yeldITA.toFixed(2)}% ITA netto={yeldITANetto.toFixed(2)}% - Investito={((totalPortfolioValueEur)).toFixed(2)}Euro /  Dividendi anno={(12*divITANetto).toFixed(2)}Euro</p>
        <p >Perdita cambio: {totalChangeLossEur.toFixed(2)}</p>
        <p style={{color:pl>=0?'green':'red'}}>P/L totale del carico: {pl.toFixed(2)}$ = {(pl/usd).toFixed(2)} Eur</p>
      </div>
    </div>
  );
};

export default StockEdit;

