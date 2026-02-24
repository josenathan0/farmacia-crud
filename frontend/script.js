const API = "http://localhost:3000";

const medForm = document.getElementById("medForm");
const medId = document.getElementById("medId");

const nome = document.getElementById("nome");
const principio_ativo = document.getElementById("principio_ativo");
const dosagem = document.getElementById("dosagem");
const forma = document.getElementById("forma");
const fabricante = document.getElementById("fabricante");
const lote = document.getElementById("lote");
const validade = document.getElementById("validade");
const quantidade = document.getElementById("quantidade");
const preco = document.getElementById("preco");

const tbody = document.getElementById("tbody");
const statusEl = document.getElementById("status");
const pillStatus = document.getElementById("pillStatus");
const badgeMode = document.getElementById("badgeMode");

const formTitle = document.getElementById("formTitle");
const btnCancelar = document.getElementById("btnCancelar");
const btnRecarregar = document.getElementById("btnRecarregar");

const searchInput = document.getElementById("searchInput");
const tabAtivos = document.getElementById("tabAtivos");
const tabExcluidos = document.getElementById("tabExcluidos");

const countAll = document.getElementById("countAll");
const countActive = document.getElementById("countActive");

const emptyState = document.getElementById("emptyState");
const toastEl = document.getElementById("toast");

let cache = [];
let mode = "ativos"; 

function toast(msg){
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(()=> (toastEl.hidden = true), 2400);
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

function setPill(msg, ok=true){
  pillStatus.textContent = msg;
  pillStatus.style.color = ok ? "#0f172a" : "#b91c1c";
}

function limparFormulario() {
  medId.value = "";
  medForm.reset();
  quantidade.value = 0;
  preco.value = 0;
  formTitle.textContent = "Novo medicamento";
}

function pegarDadosDoForm() {
  return {
    nome: nome.value.trim(),
    principio_ativo: principio_ativo.value.trim(),
    dosagem: dosagem.value.trim(),
    forma: forma.value.trim(),
    fabricante: fabricante.value.trim(),
    lote: lote.value.trim(),
    validade: validade.value,
    quantidade: Number(quantidade.value || 0),
    preco: Number(preco.value || 0),
  };
}

function formatBRL(v){
  const n = Number(v || 0);
  return `R$ ${n.toFixed(2)}`;
}

function matchesSearch(m, q){
  if (!q) return true;
  const hay = `${m.nome} ${m.principio_ativo} ${m.fabricante} ${m.dosagem} ${m.forma} ${m.lote}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

function renderTabela(lista){
  tbody.innerHTML = "";

  if (!lista.length){
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  for (const m of lista) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="chip">#${m.id}</span></td>
      <td>${m.nome}</td>
      <td>${m.principio_ativo}</td>
      <td>${m.dosagem}</td>
      <td>${m.forma}</td>
      <td>${m.validade}</td>
      <td>${m.quantidade}</td>
      <td>${formatBRL(m.preco)}</td>
      <td class="actionsCell">
        <button class="btn secondary" data-edit="${m.id}">✎ Editar</button>
        <button class="btn secondary" data-del="${m.id}">🗑 Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

function aplicarFiltros(){
  const q = searchInput.value.trim();
  let lista = cache;


  if (cache.length && Object.prototype.hasOwnProperty.call(cache[0], "deletado")) {
    lista = cache.filter(m => (mode === "ativos" ? Number(m.deletado) === 0 : Number(m.deletado) === 1));
  } else if (mode === "excluidos") {
    lista = [];
  }

  lista = lista.filter(m => matchesSearch(m, q));
  renderTabela(lista);

  countAll.textContent = String(cache.length);
  const ativos = cache.length && Object.prototype.hasOwnProperty.call(cache[0], "deletado")
    ? cache.filter(m => Number(m.deletado) === 0).length
    : cache.length;
  countActive.textContent = String(ativos);

  badgeMode.textContent = mode === "ativos" ? "Ativos" : "Excluídos";
  setStatus(`Carregado: ${lista.length} medicamento(s) (${badgeMode.textContent.toLowerCase()}).`);
}

async function listar() {
  setStatus("Carregando lista...");
  setPill("Conectando…");
  try{
    const res = await fetch(`${API}/medicamentos`);
    if (!res.ok) throw new Error("Falha ao buscar dados da API.");
    cache = await res.json();
    setPill("API conectada ✅", true);
    aplicarFiltros();
  }catch(err){
    setPill("API offline ❌", false);
    setStatus("Erro: " + err.message);
    toast("Não consegui conectar na API. Verifique o backend.");
    cache = [];
    aplicarFiltros();
  }
}

async function criar(medicamento) {
  const res = await fetch(`${API}/medicamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(medicamento),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao criar");
  }
}

async function atualizar(id, medicamento) {
  const res = await fetch(`${API}/medicamentos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(medicamento),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao atualizar");
  }
}

async function remover(id) {
  const res = await fetch(`${API}/medicamentos/${id}`, { method: "DELETE" });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao remover");
  }
}

async function carregarParaEdicao(id) {
  const res = await fetch(`${API}/medicamentos/${id}`);
  if (!res.ok) throw new Error("Não achei o medicamento.");

  const m = await res.json();

  medId.value = m.id;
  nome.value = m.nome;
  principio_ativo.value = m.principio_ativo;
  dosagem.value = m.dosagem;
  forma.value = m.forma;
  fabricante.value = m.fabricante || "";
  lote.value = m.lote || "";
  validade.value = m.validade;
  quantidade.value = m.quantidade;
  preco.value = m.preco;

  formTitle.textContent = `Editando #${m.id}`;
  toast(`Editando: ${m.nome}`);
}

medForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const dados = pegarDadosDoForm();

    if (!dados.nome || !dados.principio_ativo || !dados.dosagem || !dados.forma || !dados.validade) {
      toast("Preencha os campos obrigatórios.");
      return;
    }

    if (medId.value) {
      await atualizar(medId.value, dados);
      toast("Atualizado com sucesso!");
    } else {
      await criar(dados);
      toast("Criado com sucesso!");
    }

    limparFormulario();
    await listar();
  } catch (err) {
    toast(err.message);
    setStatus("Erro: " + err.message);
  }
});

btnCancelar.addEventListener("click", () => {
  limparFormulario();
  toast("Edição cancelada.");
});

btnRecarregar.addEventListener("click", listar);

searchInput.addEventListener("input", () => {
  aplicarFiltros();
});

tabAtivos.addEventListener("click", () => {
  mode = "ativos";
  tabAtivos.classList.add("active");
  tabExcluidos.classList.remove("active");
  aplicarFiltros();
});

tabExcluidos.addEventListener("click", () => {
  mode = "excluidos";
  tabExcluidos.classList.add("active");
  tabAtivos.classList.remove("active");
  aplicarFiltros();
  if (!cache.length || !Object.prototype.hasOwnProperty.call(cache[0], "deletado")) {
    toast("Para ver excluídos, implemente soft delete no backend.");
  }
});

tbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const idEdit = btn.getAttribute("data-edit");
  const idDel = btn.getAttribute("data-del");

  try {
    if (idEdit) {
      await carregarParaEdicao(idEdit);
      setStatus("Modo edição.");
    }

    if (idDel) {
      const ok = confirm(`Tem certeza que deseja excluir o medicamento #${idDel}?`);
      if (!ok) return;

      await remover(idDel);
      toast("Removido com sucesso!");
      await listar();
    }
  } catch (err) {
    toast(err.message);
    setStatus("Erro: " + err.message);
  }
});

// Inicializa
listar();