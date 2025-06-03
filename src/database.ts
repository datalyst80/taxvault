// database.js (nach Kompilierung aus database.ts)
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const Database = require('better-sqlite3');

const dbPath = path.join(app.getPath('userData'), 'transactions.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.prepare(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    type TEXT,
    asset TEXT,
    currency TEXT,
    amount REAL,
    price REAL,
    year INTEGER
  )
`).run();

// 👇 WICHTIG: db als Eigenschaft exportieren
module.exports = db;
