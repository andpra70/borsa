// App.tsx
import React, { useState } from 'react';
import GridComponent from './grid'; // Assicurati che il percorso sia corretto
import { ColumnConfig } from './grid'; // Assicurati che il percorso sia corretto

interface Company {
  id: number;
  nomeAzienda: string;
  fatturatoAnnuo: number;
  dataCreazione: string; // O Date object
  sede: {
    citta: string;
    provincia: string;
  };
  dipendenti: number;
  settore: string;
}


const initialCompanies: Company[] = [
  {
    id: 1,
    nomeAzienda: 'Tech Solutions Inc.',
    fatturatoAnnuo: 12000000,
    dataCreazione: '2010-05-15',
    sede: { citta: 'Milano', provincia: 'MI' },
    dipendenti: 250,
    settore: 'Software',
  },
  {
    id: 2,
    nomeAzienda: 'Global Logistics S.p.A.',
    fatturatoAnnuo: 8500000,
    dataCreazione: '2005-11-20',
    sede: { citta: 'Roma', provincia: 'RM' },
    dipendenti: 180,
    settore: 'Logistica',
  },
  {
    id: 3,
    nomeAzienda: 'Green Energy Ltd.',
    fatturatoAnnuo: 5000000,
    dataCreazione: '2018-03-01',
    sede: { citta: 'Torino', provincia: 'TO' },
    dipendenti: 75,
    settore: 'Energia Rinnovabile',
  },
  {
    id: 4,
    nomeAzienda: 'Creative Marketing SRL',
    fatturatoAnnuo: 3200000,
    dataCreazione: '2015-08-10',
    sede: { citta: 'Milano', provincia: 'MI' },
    dipendenti: 75,
    settore: 'Marketing',
  },
  {
    id: 5,
    nomeAzienda: 'Fashion Trends Co.',
    fatturatoAnnuo: 9800000,
    dataCreazione: '2008-01-25',
    sede: { citta: 'Firenze', provincia: 'FI' },
    dipendenti: 120,
    settore: 'Moda',
  },
];

const companyConfiguration: ColumnConfig<Company>[] = [
  { header: 'ID', path: 'id', sortable: true, type: 'number' },
  { header: 'Nome Azienda', path: 'nomeAzienda', sortable: true, type: 'string' },
  { header: 'Fatturato (€)', path: 'fatturatoAnnuo', sortable: true, type: 'number', render: (item) => `€ ${item.fatturatoAnnuo.toLocaleString('it-IT')}` },
  { header: 'Data Creazione', path: 'dataCreazione', sortable: true, type: 'date', render: (item) => new Date(item.dataCreazione).toLocaleDateString('it-IT') },
  { header: 'Città', path: 'sede.citta', sortable: true, type: 'string' },
  { header: 'Provincia', path: 'sede.provincia', sortable: true, type: 'string' },
  { header: 'Dipendenti', path: 'dipendenti', sortable: true, type: 'number' },
  { header: 'Settore', path: 'settore', sortable: true, type: 'string' },
];

function GridExample() {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);

  const handleRemoveCompany = (index: number, company: Company) => {
    console.log(`Rimuovi azienda: ${company.nomeAzienda} all'indice ${index}`);
    // Filtra l'array per rimuovere l'elemento
    setCompanies(prevCompanies => prevCompanies.filter((_, i) => i !== index));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Lista Aziende</h1>
      <GridComponent
        dataSet={companies}
        configuration={companyConfiguration}
        onRemove={handleRemoveCompany}
      />
    </div>
  );
}

export default GridExample;