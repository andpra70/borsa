import React, { useState, useEffect } from 'react';


class Service {

  baseUrl = 'http://localhost:5000/api/finanza/';

  data = {};

  formatNumberToBMK = (num, decimalPlaces = 1) => {
    if (typeof num !== 'number' || isNaN(num)) {
      return 'Invalid Number'; // Gestisce input non numerici o NaN
    }
    if (num === 0) {
      return '0';
    }
    const absNum = Math.abs(num); // Lavoriamo con il valore assoluto per i calcoli
    const sign = num < 0 ? '-' : ''; // Memorizziamo il segno per applicarlo alla fine
    const suffixes = [
      { value: 1e9, symbol: 'B' },  // Miliardi (Billion)
      { value: 1e6, symbol: 'M' },  // Milioni (Million)
      { value: 1e3, symbol: 'K' }   // Migliaia (Kilo)
    ];
    for (let i = 0; i < suffixes.length; i++) {
      const suffix = suffixes[i];
      if (absNum >= suffix.value) {
        // Calcola il numero con la precisione desiderata
        // Usiamo toFixed e parseFloat per gestire la precisione e rimuovere zero finali superflui (es. "1.0M" -> "1M")
        const formatted = (absNum / suffix.value).toFixed(decimalPlaces);
        return sign + parseFloat(formatted) + suffix.symbol;
      }
    }
    // Se il numero è inferiore a 1000, lo restituiamo come stringa senza suffisso
    return sign + num.toString();
  }

  getValueByPath = (obj, path) => {
    if (obj === null || typeof obj === 'undefined' || typeof path !== 'string') {
      return null;
    }
    if (path === '') {
      return obj;
    }
    const pathParts = path.split('.');
    let current = obj;
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (current === null || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, part)) {
        return null; // Il path non è raggiungibile a questo punto
      }
      current = current[part];
    }
    return current;
  }

  fetchUSD = async (ticker: string) => {
    const response = await fetch(this.baseUrl + 'usd/' + 'USDEUR=X');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    var ret= await response.json();
    return ret;
  }

  fetchTicker2 = async (ticker: string) => {
    const response = await fetch(this.baseUrl + 'tickerSA/' + ticker);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    var data = await response.json();
    var ret = {
      ticker: data['ticker'],
      company_name: data['company_name'],
      last_updated: data['last_updated'],
      dividend: this.getValueByPath(data, 'data.overview.key_metrics.Dividend'),
      open: this.getValueByPath(data, 'data.overview.key_metrics.Open'),
      close: this.getValueByPath(data, 'data.overview.key_metrics.Previous Close'),
      analysts: this.getValueByPath(data, 'data.overview.key_metrics.Analysts'),
      priceTarget: this.getValueByPath(data, 'data.overview.key_metrics.Price Target')
    };
    return ret;
  }

  fetchTicker = async (ticker: string) => {
    const response = await fetch(this.baseUrl + 'ticker/' + ticker);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    data._data = await this.fetchTickerSA(ticker);
    console.log('Fetched tickerSA', data);
    return data;
  }

  fetchTickerSA = async (ticker: string) => {
    const response = await fetch(this.baseUrl + 'tickerSA/' + ticker);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    var data = await response.json();
    return data;
  }

  store(data: any) {
    console.log('Storing to storage', data);
    localStorage.setItem('portfolio', JSON.stringify(data));
  }

  load() {
    console.log('Loading from storage');
    var ret = localStorage.getItem('portfolio');
    return JSON.parse(ret || '[]');
  }

};
export var service = new Service();
const test = () => {
  service.fetchTicker('AGNC').then(data => console.log(data));
};
test();

export default service;