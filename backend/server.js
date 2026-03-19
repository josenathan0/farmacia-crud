const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

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
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "API AuraFarma online." });
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

    const qtd = Number(quantidade ?? 0);
    const valor = Number(preco ?? 0);

    if (Number.isNaN(qtd) || qtd < 0) {
      return res.status(400).json({ error: "Quantidade inválida." });
    }

    if (Number.isNaN(valor) || valor < 0) {
      return res.status(400).json({ error: "Preço inválido." });
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
        nome.trim(),
        principio_ativo.trim(),
        dosagem.trim(),
        forma.trim(),
        (fabricante || "").trim(),
        (lote || "").trim(),
        validade,
        qtd,
        valor,
      ]
    );

    const novo = await getAsync(`SELECT * FROM medicamentos WHERE id = ?`, [result.lastID]);
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

    const qtd = Number(quantidade ?? 0);
    const valor = Number(preco ?? 0);

    if (Number.isNaN(qtd) || qtd < 0) {
      return res.status(400).json({ error: "Quantidade inválida." });
    }

    if (Number.isNaN(valor) || valor < 0) {
      return res.status(400).json({ error: "Preço inválido." });
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
        nome.trim(),
        principio_ativo.trim(),
        dosagem.trim(),
        forma.trim(),
        (fabricante || "").trim(),
        (lote || "").trim(),
        validade,
        qtd,
        valor,
        req.params.id,
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Medicamento não encontrado." });
    }

    const atualizado = await getAsync(`SELECT * FROM medicamentos WHERE id = ?`, [req.params.id]);
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

    const idMedicamento = Number(medicamento_id);
    const qtd = Number(quantidade);
    const preco = Number(preco_unitario);

    if (!idMedicamento) {
      return res.status(400).json({ error: "Selecione um medicamento." });
    }

    if (Number.isNaN(qtd) || qtd <= 0) {
      return res.status(400).json({ error: "Informe uma quantidade válida." });
    }

    if (Number.isNaN(preco) || preco < 0) {
      return res.status(400).json({ error: "Informe um preço válido." });
    }

    const medicamento = await getAsync(
      `SELECT * FROM medicamentos WHERE id = ? AND deletado = 0`,
      [idMedicamento]
    );

    if (!medicamento) {
      return res.status(404).json({ error: "Medicamento não encontrado." });
    }

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
      [idMedicamento, qtd, preco, total]
    );

    await runAsync(
      `
      UPDATE medicamentos
      SET
        quantidade = quantidade - ?,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [qtd, idMedicamento]
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

app.get("/dashboard/resumo", async (req, res) => {
  try {
    const medicamentos = await allAsync(
      `
      SELECT *
      FROM medicamentos
      ORDER BY nome COLLATE NOCASE ASC
      `
    );

    const vendas = await allAsync(
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
      ORDER BY datetime(v.vendido_em) DESC, v.id DESC
      `
    );

    const ativos = medicamentos.filter((m) => Number(m.deletado) !== 1);

    const faturamentoTotal = vendas.reduce((sum, v) => sum + Number(v.total || 0), 0);
    const totalItensVendidos = vendas.reduce((sum, v) => sum + Number(v.quantidade || 0), 0);
    const estoqueTotal = ativos.reduce((sum, m) => sum + Number(m.quantidade || 0), 0);
    const valorEstoque = ativos.reduce(
      (sum, m) => sum + Number(m.quantidade || 0) * Number(m.preco || 0),
      0
    );

    const topMap = new Map();
    for (const venda of vendas) {
      const nome = venda.nome || "Medicamento sem nome";
      const current = topMap.get(nome) || { nome, quantidade: 0, total: 0 };
      current.quantidade += Number(venda.quantidade || 0);
      current.total += Number(venda.total || 0);
      topMap.set(nome, current);
    }

    const ranking = [...topMap.values()].sort((a, b) => b.quantidade - a.quantidade);

    res.json({
      medicamentos,
      vendas,
      indicadores: {
        faturamentoTotal,
        totalItensVendidos,
        estoqueTotal,
        valorEstoque,
        totalMedicamentosAtivos: ativos.length,
        totalVendas: vendas.length,
        maisVendido: ranking[0] || null,
      },
      ranking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

app.listen(PORT, () => {
  console.log(`Servidor AuraFarma rodando em http://localhost:${PORT}`);
});