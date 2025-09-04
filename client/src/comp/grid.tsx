import React, { useState, useMemo, useCallback } from 'react';

// types.ts

export interface ColumnConfig<T> {
  header: string;
  path: string;
  sortable?: boolean;
  type?: 'string' | 'number' | 'date' | 'cash'; // Tipo di dato per l'ordinamento
  value?: (item: T) => any; // Funzione per ottenere il valore dalla riga
  render?: (item: T) => React.ReactNode; // Per rendering personalizzato
}

export interface GridProps<T> {
  dataSet: T[];
  configuration: ColumnConfig<T>[];
  onRemove?: (index: number, item: T) => void;
  onSelect?: (index: number, item: T) => void;
}

export interface SortState {
  path: string;
  direction: 'asc' | 'desc';
}


// Funzione helper per ottenere un valore da un oggetto usando un percorso stringa
const getNestedValue = <T,>(obj: T, path: string): any => {
  return path.split('.').reduce((acc: any, part: string) => acc && acc[part], obj);
};

// Funzione helper per confrontare due valori in base al tipo
const compareValues = (valueA: any, valueB: any, type: 'string' | 'number' | 'date' | 'cash'): number => {
  if (valueA === null || valueA === undefined) return (valueB === null || valueB === undefined) ? 0 : -1;
  if (valueB === null || valueB === undefined) return 1;

  switch (type) {
    case 'cash':
    case 'number':
      return (Number(valueA) || 0) - (Number(valueB) || 0);
    case 'date':
      const dateA = valueA instanceof Date ? valueA : new Date(valueA);
      const dateB = valueB instanceof Date ? valueB : new Date(valueB);
      return dateA.getTime() - dateB.getTime();
    case 'string':
    default:
      return String(valueA).localeCompare(String(valueB));
  }
};

function GridComponent<T extends object>({ dataSet, configuration, onRemove, onSelect }: GridProps<T>) {
  const [sortStates, setSortStates] = useState<SortState[]>([]);

  const initialize=()=>{
    configuration = configuration.map(col => {
      if (col.type === 'cash') {
        return { ...col, render: (item) => {
          const value=getNestedValue(item,col.path);
          return value ? `${value.toFixed(2)}`: ''; 
        }};
      }
      if (col.type === 'date') {
        return { ...col, render: (item) => {
          const value=getNestedValue(item,col.path);  
          //console.log('Date value------------------>', value);        
          return value ? new Date(value).toLocaleDateString('it-IT') : '';
        }};
      }
      return col;
    });
  }
  initialize();
  // Gestione dell'ordinamento
  const handleSort = useCallback((columnPath: string, columnType: 'string' | 'number' | 'date' = 'string') => {
    setSortStates(prevSortStates => {
      const existingSortIndex = prevSortStates.findIndex(s => s.path === columnPath);

      if (existingSortIndex > -1) {
        // La colonna è già ordinata, inverti la direzione o rimuovila se già desc
        const currentSort = prevSortStates[existingSortIndex];
        if (currentSort.direction === 'asc') {
          return prevSortStates.map((s, idx) =>
            idx === existingSortIndex ? { ...s, direction: 'desc' } : s
          );
        } else {
          // Rimuovi l'ordinamento se è già discendente
          return prevSortStates.filter((_, idx) => idx !== existingSortIndex);
        }
      } else {
        // Aggiungi un nuovo ordinamento
        return [...prevSortStates, { path: columnPath, direction: 'asc' }];
      }
    });
  }, []);

  // Dati ordinati
  const sortedData = useMemo(() => {
    if (sortStates.length === 0) {
      return dataSet;
    }

    // Copia i dati per non mutare l'array originale
    const dataToSort = [...dataSet];

    dataToSort.sort((a, b) => {
      for (const sortState of sortStates) {
        const columnConfig = configuration.find(c => c.path === sortState.path);
        if (!columnConfig) continue; // Salta se la configurazione della colonna non è trovata

        const valueA = getNestedValue(a, sortState.path);
        const valueB = getNestedValue(b, sortState.path);
        const type = columnConfig.type || 'string'; // Usa il tipo della colonna o default string

        let comparison = compareValues(valueA, valueB, type);

        if (comparison !== 0) {
          return sortState.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0; // Se tutti gli ordinamenti multipli sono uguali
    });

    return dataToSort;
  }, [dataSet, sortStates, configuration]);

  // Gestione della rimozione
  const handleRemove = useCallback((index: number, item: T) => {
    if (onRemove) {
      onRemove(index, item);
    }
  }, [onRemove]);

  const handleSelect = useCallback((index: number, item: T) => {
    if (onSelect) {
      onSelect(index, item);
    }
  }, [onSelect]);

  return (
    <div style={{ fontWeight: 550, fontSize:'0.7em', width: '100%' }}>
      <table class="table table-striped">
        <thead class="thead-dark">
          <tr>
            {configuration.map((col, index) => (
              <th scope="col"
                key={col.path || `header-${index}`} // Usa path come chiave o un fallback
                
                onClick={() => col.sortable && handleSort(col.path, col.type)}
              >
                {col.header}
                {col.sortable && (
                  <span style={{ marginLeft: '5px' }}>
                    {sortStates.find(s => s.path === col.path)?.direction === 'asc' ? ' ▲' : ''}
                    {sortStates.find(s => s.path === col.path)?.direction === 'desc' ? ' ▼' : ''}
                  </span>
                )}
              </th>
            ))}
            {onRemove && (
              <th style={{ padding: '8px', border: '1px solid #ddd', width: '50px' }}>
                Azioni
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, rowIndex) => (
            <tr key={rowIndex} style={{ borderBottom: '1px solid #eee' }}>
              {configuration.map((col, colIndex) => (
                <td key={col.path || `cell-${rowIndex}-${colIndex}`} style={{ padding: '8px', border: '1px solid #ddd',textAlign: 'right' }}>
                  {col.render ? col.render(item) : String(getNestedValue(item, col.path))}
                </td>
              ))}
              {onRemove && (
                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                  <button
                    onClick={() => handleRemove(rowIndex, item)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    X
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GridComponent;