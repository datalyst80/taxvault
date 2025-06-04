import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

// Datenbank importieren (CommonJS)
const db = require('./database.js');

type Transaction = {
  date: string;
  type: string;
  asset: string;     // z. B. Bitcoin, Solana
  currency: string;  // z. B. EUR, USD
  amount: number;
  price: number;
  year: number;
};

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    titleBarOverlay: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  
  win.maximize();
  win.loadFile(path.join(__dirname, '../index.html'));
}

// Einzelne Transaktion speichern
ipcMain.on('save-transaction', (event, transaction: Transaction) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO transactions (date, type, asset, currency, amount, price, year)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      transaction.date,
      transaction.type,
      transaction.asset,
      transaction.currency,
      transaction.amount,
      transaction.price,
      transaction.year
    );

    // Nach dem Speichern alle Transaktionen laden und zurücksenden
    const rows = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
    event.reply('transactions-loaded', rows);
  } catch (error: unknown) {
    console.error('Fehler beim Speichern:', error);
    if (error instanceof Error) {
      event.reply('error', error.message);
    } else {
      event.reply('error', 'Unbekannter Fehler beim Speichern');
    }
  }
});

// Mehrere Transaktionen speichern (Bulk-Import)
ipcMain.on('save-transactions', (event, transactions: Transaction[]) => {
  try {
    const insert = db.prepare(`
      INSERT INTO transactions (date, type, asset, currency, amount, price, year)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((txs: Transaction[]) => {
      for (const t of txs) {
        insert.run(t.date, t.type, t.asset, t.currency, t.amount, t.price, t.year);
      }
    });

    insertMany(transactions);

    // Nach Bulk-Save alle Transaktionen laden und zurücksenden
    const rows = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
    event.reply('transactions-loaded', rows);

  } catch (error: unknown) {
    console.error('Fehler beim Bulk-Speichern:', error);
    if (error instanceof Error) {
      event.reply('error', error.message);
    } else {
      event.reply('error', 'Unbekannter Fehler beim Bulk-Speichern');
    }
  }
});

// Alle Transaktionen laden
ipcMain.on('load-transactions', (event) => {
  try {
    const rows = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
    event.reply('transactions-loaded', rows);
  } catch (error: unknown) {
    console.error('Fehler beim Laden:', error);
    if (error instanceof Error) {
      event.reply('error', error.message);
    } else {
      event.reply('error', 'Unbekannter Fehler beim Laden');
    }
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
