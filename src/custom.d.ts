declare module 'better-sqlite3' {
  class Database {
    constructor(filename: string, options?: any);
    prepare(sql: string): {
      run(...params: any[]): any;
      get?(...params: any[]): any;
      all?(...params: any[]): any[];
    };
  }
  export default Database;
}

export {}; // WICHTIG! Damit diese Datei als Modul erkannt wird

declare global {
  interface Transaction {
    date: string;
    type: string;
    asset: string;    // z. B. Bitcoin, Solana
    currency: string;
    amount: number;
    price: number;
    year: number;
  }

  interface ElectronAPI {
  saveTransaction: (data: Transaction) => void;
  saveTransactions: (data: Transaction[]) => void;
  loadTransactions: () => void;   // <-- Hier hinzufügen
  sendMessage?: (channel: string, data: any) => void;
  onMessage?: (channel: string, callback: (event: any, data: any) => void) => void;
  onTransactionsLoaded: (callback: (transactions: Transaction[]) => void) => void;
  onError: (callback: (error: string) => void) => void;
}

  interface Window {
    electronAPI: ElectronAPI;
  }
}
