const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

app.get("/", (req, res) => {
  res.json({ message: "API AuraFarma online." });
});

app.get("/medicamentos", async (req, res) => {
  try {
    const rows = await allAsync(`
      SELECT
        id,
        nome,
        principio_ativo,
        dosagem,
        forma,
        fabricante,
        lote,
        validade,
        quantidade,
        preco,
        deletado,
        deletado_em,
        criado_em,
        atualizado_em
      FROM medicamentos
      ORDER BY nome COLLATE NOCASE ASC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/medicamentos/:id", async (req, res) => {
  try {
    const row = await getAsync(
      `
      SELECT
        id,
        nome,
        principio_ativo,
        dosagem,
        forma,
        fabricante,
        lote,
        validade,
        quantidade,
        preco,
        deletado,
        deletado_em,
        criado_em,
        atualizado_em
      FROM medicamentos
      WHERE id = ?
      `,
      [req.params.id]
    );

    if (!row) {
      return res.status(404).json({ error: "Medicamento não encontrado." });
    }

    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/medicamentos", async (req, res) => {
  try {
    const {
      nome,
      principio_ativo,
      dosagem,
      forma,
      fabricante,
      lote,
      validade,
      quantidade,
      preco,
    } = req.body;

    if (!nome || !principio_ativo || !dosagem || !forma || !validade) {
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    const result = await runAsync(
      `
      INSERT INTO medicamentos (
        nome,
        principio_ativo,
        dosagem,
        forma,
        fabricante,
        lote,
        validade,
        quantidade,
        preco,
        deletado,
        deletado_em,
        criado_em,
        atualizado_em
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [
        nome,
        principio_ativo,
        dosagem,
        forma,
        fabricante || "",
        lote || "",
        validade,
        Number(quantidade || 0),
        Number(preco || 0),
      ]
    );

    const novo = await getAsync("SELECT * FROM medicamentos WHERE id = ?", [result.lastID]);
    res.status(201).json(novo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/medicamentos/:id", async (req, res) => {
  try {
    const {
      nome,
      principio_ativo,
      dosagem,
      forma,
      fabricante,
      lote,
      validade,
      quantidade,
      preco,
    } = req.body;

    if (!nome || !principio_ativo || !dosagem || !forma || !validade) {
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    const result = await runAsync(
      `
      UPDATE medicamentos
      SET
        nome = ?,
        principio_ativo = ?,
        dosagem = ?,
        forma = ?,
        fabricante = ?,
        lote = ?,
        validade = ?,
        quantidade = ?,
        preco = ?,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [
        nome,
        principio_ativo,
        dosagem,
        forma,
        fabricante || "",
        lote || "",
        validade,
        Number(quantidade || 0),
        Number(preco || 0),
        req.params.id,
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Medicamento não encontrado." });
    }

    const atualizado = await getAsync("SELECT * FROM medicamentos WHERE id = ?", [req.params.id]);
    res.json(atualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/medicamentos/:id", async (req, res) => {
  try {
    const result = await runAsync(
      `
      UPDATE medicamentos
      SET
        deletado = 1,
        deletado_em = CURRENT_TIMESTAMP,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Medicamento não encontrado." });
    }

    res.json({ message: "Medicamento excluído com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/medicamentos/:id/restaurar", async (req, res) => {
  try {
    const result = await runAsync(
      `
      UPDATE medicamentos
      SET
        deletado = 0,
        deletado_em = NULL,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Medicamento não encontrado." });
    }

    res.json({ message: "Medicamento restaurado com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/vendas", async (req, res) => {
  try {
    const rows = await allAsync(`
      SELECT
        v.id,
        v.medicamento_id,
        v.quantidade,
        v.preco_unitario,
        v.total,
        v.vendido_em,
        m.nome
      FROM vendas v
      LEFT JOIN medicamentos m ON m.id = v.medicamento_id
      ORDER BY datetime(v.vendido_em) DESC, v.id DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/vendas", async (req, res) => {
  try {
    const { medicamento_id, quantidade, preco_unitario } = req.body;

    if (!medicamento_id) {
      return res.status(400).json({ error: "Selecione um medicamento." });
    }

    if (!quantidade || Number(quantidade) <= 0) {
      return res.status(400).json({ error: "Informe uma quantidade válida." });
    }

    if (Number(preco_unitario) < 0) {
      return res.status(400).json({ error: "Informe um preço válido." });
    }

    const medicamento = await getAsync(
      `SELECT * FROM medicamentos WHERE id = ? AND deletado = 0`,
      [medicamento_id]
    );

    if (!medicamento) {
      return res.status(404).json({ error: "Medicamento não encontrado." });
    }

    const qtd = Number(quantidade);
    const preco = Number(preco_unitario);

    if (Number(medicamento.quantidade) < qtd) {
      return res.status(400).json({ error: "Estoque insuficiente para registrar a venda." });
    }

    const total = qtd * preco;

    const insert = await runAsync(
      `
      INSERT INTO vendas (
        medicamento_id,
        quantidade,
        preco_unitario,
        total,
        vendido_em
      )
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [medicamento_id, qtd, preco, total]
    );

    await runAsync(
      `
      UPDATE medicamentos
      SET
        quantidade = quantidade - ?,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [qtd, medicamento_id]
    );

    const venda = await getAsync(
      `
      SELECT
        v.id,
        v.medicamento_id,
        v.quantidade,
        v.preco_unitario,
        v.total,
        v.vendido_em,
        m.nome
      FROM vendas v
      LEFT JOIN medicamentos m ON m.id = v.medicamento_id
      WHERE v.id = ?
      `,
      [insert.lastID]
    );

    res.status(201).json(venda);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor AuraFarma rodando em http://localhost:${PORT}`);
});