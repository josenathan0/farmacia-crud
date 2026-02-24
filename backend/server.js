const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

app.get("/", (req, res) => {
  res.json({ ok: true, message: "API da Farmácia rodando!" });
});

// CREATE
app.post("/medicamentos", (req, res) => {
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
    return res.status(400).json({ error: "Preencha os campos obrigatórios." });
  }

  const sql = `
    INSERT INTO medicamentos
    (nome, principio_ativo, dosagem, forma, fabricante, lote, validade, quantidade, preco)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    nome,
    principio_ativo,
    dosagem,
    forma,
    fabricante || "",
    lote || "",
    validade,
    Number(quantidade ?? 0),
    Number(preco ?? 0),
  ];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.status(201).json({
      id: this.lastID,
      ...req.body,
    });
  });
});

// READ (todos)
app.get("/medicamentos", (req, res) => {
  db.all("SELECT * FROM medicamentos ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// READ (um por id)
app.get("/medicamentos/:id", (req, res) => {
  const id = Number(req.params.id);

  db.get("SELECT * FROM medicamentos WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Medicamento não encontrado." });
    res.json(row);
  });
});

// UPDATE
app.put("/medicamentos/:id", (req, res) => {
  const id = Number(req.params.id);

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
    return res.status(400).json({ error: "Preencha os campos obrigatórios." });
  }

  const sql = `
    UPDATE medicamentos
    SET nome=?, principio_ativo=?, dosagem=?, forma=?, fabricante=?, lote=?, validade=?, quantidade=?, preco=?
    WHERE id=?
  `;

  const params = [
    nome,
    principio_ativo,
    dosagem,
    forma,
    fabricante || "",
    lote || "",
    validade,
    Number(quantidade ?? 0),
    Number(preco ?? 0),
    id,
  ];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Medicamento não encontrado." });

    res.json({ id, ...req.body });
  });
});

// DELETE
app.delete("/medicamentos/:id", (req, res) => {
  const id = Number(req.params.id);

  db.run("DELETE FROM medicamentos WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Medicamento não encontrado." });

    res.json({ message: "Medicamento removido com sucesso." });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});