import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

const validChannels = {
  saveTransaction: 'save-transaction',
  saveTransactions: 'save-transactions',  // neu
  loadTransactions: 'load-transactions',
  transactionsLoaded: 'transactions-loaded',
  error: 'error'
};

contextBridge.exposeInMainWorld('electronAPI', {
  saveTransaction: (transaction: any) => {
    ipcRenderer.send(validChannels.saveTransaction, transaction);
  },
  saveTransactions: (transactions: any[]) => {     // neu
    ipcRenderer.send(validChannels.saveTransactions, transactions);
  },
  loadTransactions: () => {
    ipcRenderer.send(validChannels.loadTransactions);
  },
  onTransactionsLoaded: (callback: (transactions: any[]) => void) => {
    ipcRenderer.on(validChannels.transactionsLoaded, (_event: IpcRendererEvent, data) => callback(data));
  },
  onError: (callback: (error: string) => void) => {
    ipcRenderer.on(validChannels.error, (_event: IpcRendererEvent, error) => callback(error));
  }
});
