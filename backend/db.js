const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "farmacia.sqlite");
const db = new sqlite3.Database(dbPath);

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

async function ensureColumn(tableName, columnName, definition) {
  const columns = await allAsync(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);

  if (!exists) {
    await runAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensureMedicamentosTable() {
  await runAsync(`
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
      preco REAL NOT NULL DEFAULT 0,
      deletado INTEGER NOT NULL DEFAULT 0,
      deletado_em TEXT,
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensureColumn("medicamentos", "deletado", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn("medicamentos", "deletado_em", "TEXT");

  await ensureColumn("medicamentos", "criado_em", "TEXT");
  await ensureColumn("medicamentos", "atualizado_em", "TEXT");

  await runAsync(`
    UPDATE medicamentos
    SET deletado = COALESCE(deletado, 0)
  `);

  await runAsync(`
    UPDATE medicamentos
    SET criado_em = COALESCE(criado_em, CURRENT_TIMESTAMP)
  `);

  await runAsync(`
    UPDATE medicamentos
    SET atualizado_em = COALESCE(atualizado_em, CURRENT_TIMESTAMP)
  `);
}

async function ensureVendasTable() {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicamento_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL,
      preco_unitario REAL NOT NULL,
      total REAL NOT NULL,
      vendido_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id)
    )
  `);
}

async function ensureIndexes() {
  await runAsync(`
    CREATE INDEX IF NOT EXISTS idx_medicamentos_nome
    ON medicamentos(nome)
  `);

  await runAsync(`
    CREATE INDEX IF NOT EXISTS idx_medicamentos_deletado
    ON medicamentos(deletado)
  `);

  await runAsync(`
    CREATE INDEX IF NOT EXISTS idx_vendas_medicamento_id
    ON vendas(medicamento_id)
  `);

  await runAsync(`
    CREATE INDEX IF NOT EXISTS idx_vendas_vendido_em
    ON vendas(vendido_em)
  `);
}

async function initializeDatabase() {
  await ensureMedicamentosTable();
  await ensureVendasTable();
  await ensureIndexes();
  console.log("Banco de dados inicializado com sucesso.");
}

initializeDatabase().catch((err) => {
  console.error("Erro ao inicializar o banco:", err.message);
});

module.exports = db;