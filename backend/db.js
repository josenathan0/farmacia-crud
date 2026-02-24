const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "farmacia.sqlite");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS medicamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      principio_ativo TEXT NOT NULL,
      dosagem TEXT NOT NULL,
      forma TEXT NOT NULL,
      fabricante TEXT,
      lote TEXT,
      validade TEXT NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 0,
      preco REAL NOT NULL DEFAULT 0
    )
  `);
});

module.exports = db;