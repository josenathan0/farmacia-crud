const API = "";

const STORAGE_KEYS = {
  currentView: "aurafarma_current_view",
  currentTab: "aurafarma_current_tab",
};

const state = {
  medicamentos: [],
  vendas: [],
  currentTab: localStorage.getItem(STORAGE_KEYS.currentTab) || "ativos",
  currentView: localStorage.getItem(STORAGE_KEYS.currentView) || "dashboardView",
  charts: {
    topVendidos: null,
    formas: null,
    vendasPorDia: null,
    estoqueMedicamentos: null,
  },
};

const els = {
  navDashboard: document.getElementById("navDashboard"),
  navMedicamentos: document.getElementById("navMedicamentos"),
  dashboardView: document.getElementById("dashboardView"),
  medicamentosView: document.getElementById("medicamentosView"),
  goToMedicamentosBtn: document.getElementById("goToMedicamentosBtn"),
  refreshAllBtn: document.getElementById("refreshAllBtn"),

  toast: document.getElementById("toast"),

  tabAtivos: document.getElementById("tabAtivos"),
  tabExcluidos: document.getElementById("tabExcluidos"),
  recordsInfo: document.getElementById("recordsInfo"),
  searchInput: document.getElementById("searchInput"),
  reloadMedicamentosBtn: document.getElementById("reloadMedicamentosBtn"),
  medTableBody: document.getElementById("medTableBody"),

  medForm: document.getElementById("medForm"),
  medId: document.getElementById("medId"),
  formTitle: document.getElementById("formTitle"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),

  nome: document.getElementById("nome"),
  principio_ativo: document.getElementById("principio_ativo"),
  dosagem: document.getElementById("dosagem"),
  forma: document.getElementById("forma"),
  fabricante: document.getElementById("fabricante"),
  lote: document.getElementById("lote"),
  validade: document.getElementById("validade"),
  quantidade: document.getElementById("quantidade"),
  preco: document.getElementById("preco"),

  kpiFaturamentoTotal: document.getElementById("kpiFaturamentoTotal"),
  kpiFaturamentoMes: document.getElementById("kpiFaturamentoMes"),
  kpiVendas: document.getElementById("kpiVendas"),
  kpiItensVendidos: document.getElementById("kpiItensVendidos"),
  kpiMedicamentosAtivos: document.getElementById("kpiMedicamentosAtivos"),
  kpiEstoqueTotal: document.getElementById("kpiEstoqueTotal"),
  kpiValorEstoque: document.getElementById("kpiValorEstoque"),
  kpiMaisVendido: document.getElementById("kpiMaisVendido"),

  topVendidos: document.getElementById("topVendidos"),
  estoqueBaixo: document.getElementById("estoqueBaixo"),
  vencendoLista: document.getElementById("vencendoLista"),
  formasDistribuicao: document.getElementById("formasDistribuicao"),
  ultimasVendasTable: document.getElementById("ultimasVendasTable"),

  vendaForm: document.getElementById("vendaForm"),
  vendaMedicamento: document.getElementById("vendaMedicamento"),
  vendaQuantidade: document.getElementById("vendaQuantidade"),
  vendaPreco: document.getElementById("vendaPreco"),

  chartTopVendidos: document.getElementById("chartTopVendidos"),
  chartFormas: document.getElementById("chartFormas"),
  chartVendasPorDia: document.getElementById("chartVendasPorDia"),
  chartEstoqueMedicamentos: document.getElementById("chartEstoqueMedicamentos"),
};

function persistState() {
  localStorage.setItem(STORAGE_KEYS.currentView, state.currentView);
  localStorage.setItem(STORAGE_KEYS.currentTab, state.currentTab);
}

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(els.toast._timer);
  els.toast._timer = setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2600);
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("pt-BR");
}

function formatDateTime(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleString("pt-BR");
}

function daysUntil(dateString) {
  if (!dateString) return null;
  const now = new Date();
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return null;
  const baseNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const baseTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffMs = baseTarget - baseNow;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getMedicamentosAtivos() {
  return state.medicamentos.filter((m) => Number(m.deletado) !== 1);
}

function getMedicamentosExcluidos() {
  return state.medicamentos.filter((m) => Number(m.deletado) === 1);
}

function getFilteredMedicamentos() {
  const query = (els.searchInput?.value || "").trim().toLowerCase();
  const base =
    state.currentTab === "ativos"
      ? getMedicamentosAtivos()
      : getMedicamentosExcluidos();

  return base.filter((m) => {
    const text = [
      m.nome,
      m.principio_ativo,
      m.fabricante,
      m.forma,
      m.dosagem,
      m.lote,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(query);
  });
}

function setView(viewId) {
  state.currentView = viewId;
  persistState();

  els.dashboardView?.classList.toggle("active", viewId === "dashboardView");
  els.medicamentosView?.classList.toggle("active", viewId === "medicamentosView");

  els.navDashboard?.classList.toggle("active", viewId === "dashboardView");
  els.navMedicamentos?.classList.toggle("active", viewId === "medicamentosView");
}

function setMedicamentosTab(tab) {
  state.currentTab = tab;
  persistState();

  els.tabAtivos?.classList.toggle("active", tab === "ativos");
  els.tabExcluidos?.classList.toggle("active", tab === "excluidos");
  renderMedicamentosTable();
}

function goToMedicamentos(tab = state.currentTab || "ativos") {
  setView("medicamentosView");
  setMedicamentosTab(tab);
}

function clearMedicamentoForm() {
  if (!els.medForm) return;
  els.medForm.reset();
  if (els.medId) els.medId.value = "";
  if (els.formTitle) els.formTitle.textContent = "Cadastrar medicamento";
}

function getMedicamentoFormData() {
  return {
    nome: els.nome?.value.trim() || "",
    principio_ativo: els.principio_ativo?.value.trim() || "",
    dosagem: els.dosagem?.value.trim() || "",
    forma: els.forma?.value.trim() || "",
    fabricante: els.fabricante?.value.trim() || "",
    lote: els.lote?.value.trim() || "",
    validade: els.validade?.value || "",
    quantidade: Number(els.quantidade?.value || 0),
    preco: Number(els.preco?.value || 0),
  };
}

function validateMedicamento(data) {
  if (!data.nome || !data.principio_ativo || !data.dosagem || !data.forma || !data.validade) {
    throw new Error("Preencha todos os campos obrigatórios.");
  }

  if (data.quantidade < 0) {
    throw new Error("A quantidade não pode ser negativa.");
  }

  if (data.preco < 0) {
    throw new Error("O preço não pode ser negativo.");
  }
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = "Erro na requisição.";
    try {
      const payload = await response.json();
      errorMessage = payload.error || payload.message || errorMessage;
    } catch {
      //
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

async function loadMedicamentos() {
  const data = await apiFetch("/medicamentos");
  state.medicamentos = Array.isArray(data) ? data : [];
}

async function loadVendas() {
  try {
    const data = await apiFetch("/vendas");
    state.vendas = Array.isArray(data) ? data : [];
  } catch {
    state.vendas = [];
  }
}

function renderMedicamentosTable() {
  if (!els.medTableBody) return;

  const lista = getFilteredMedicamentos();

  if (!lista.length) {
    els.medTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="tableEmpty">Nenhum medicamento encontrado.</td>
      </tr>
    `;
  } else {
    els.medTableBody.innerHTML = lista
      .map((m) => {
        const statusBadge =
          Number(m.deletado) === 1
            ? `<span class="badge danger">Excluído</span>`
            : Number(m.quantidade) <= 5
            ? `<span class="badge warning">Estoque baixo</span>`
            : `<span class="badge success">Ativo</span>`;

        const actions =
          Number(m.deletado) === 1
            ? `<button class="actionBtn restore" data-restore="${m.id}" type="button">Restaurar</button>`
            : `
              <button class="actionBtn edit" data-edit="${m.id}" type="button">Editar</button>
              <button class="actionBtn delete" data-delete="${m.id}" type="button">Excluir</button>
            `;

        return `
          <tr>
            <td>${m.nome || "—"}</td>
            <td>${m.principio_ativo || "—"}</td>
            <td>${m.forma || "—"}</td>
            <td>${Number(m.quantidade || 0)}</td>
            <td>${formatCurrency(m.preco)}</td>
            <td>${formatDate(m.validade)}</td>
            <td>${statusBadge}</td>
            <td><div class="rowActions">${actions}</div></td>
          </tr>
        `;
      })
      .join("");
  }

  if (els.recordsInfo) {
    els.recordsInfo.textContent = `${lista.length} registro(s) encontrados`;
  }

  populateVendaMedicamentoOptions();
}

function populateVendaMedicamentoOptions() {
  if (!els.vendaMedicamento) return;

  const ativos = getMedicamentosAtivos();

  els.vendaMedicamento.innerHTML = `
    <option value="">Selecione um medicamento</option>
    ${ativos
      .map(
        (m) => `
          <option value="${m.id}" data-preco="${Number(m.preco || 0)}">
            ${m.nome} • estoque: ${Number(m.quantidade || 0)} • ${formatCurrency(m.preco)}
          </option>
        `
      )
      .join("")}
  `;
}

function destroyChart(chart) {
  if (chart) chart.destroy();
}

function renderCharts(ativos, vendas, ranking) {
  renderChartTopVendidos(ranking);
  renderChartFormas(ativos);
  renderChartVendasPorDia(vendas);
  renderChartEstoqueMedicamentos(ativos);
}

function renderChartTopVendidos(ranking) {
  if (!els.chartTopVendidos) return;

  destroyChart(state.charts.topVendidos);

  const top = ranking.slice(0, 5);
  const labels = top.map((item) => item.nome);
  const data = top.map((item) => item.quantidade);

  state.charts.topVendidos = new Chart(els.chartTopVendidos, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Qtd. vendida",
          data,
          backgroundColor: [
            "rgba(53,224,199,0.85)",
            "rgba(58,140,255,0.85)",
            "rgba(255,191,105,0.85)",
            "rgba(255,107,122,0.85)",
            "rgba(73,209,125,0.85)",
          ],
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#ecf3ff" } },
      },
      scales: {
        x: {
          ticks: { color: "#9fb0ca" },
          grid: { color: "rgba(255,255,255,0.06)" },
        },
        y: {
          ticks: { color: "#9fb0ca" },
          grid: { color: "rgba(255,255,255,0.06)" },
          beginAtZero: true,
        },
      },
    },
  });
}

function renderChartFormas(ativos) {
  if (!els.chartFormas) return;

  destroyChart(state.charts.formas);

  const map = new Map();
  for (const item of ativos) {
    const key = item.forma || "Não informado";
    map.set(key, (map.get(key) || 0) + Number(item.quantidade || 0));
  }

  const labels = [...map.keys()];
  const data = [...map.values()];

  state.charts.formas = new Chart(els.chartFormas, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "#35e0c7",
            "#3a8cff",
            "#ffbf69",
            "#ff6b7a",
            "#49d17d",
            "#9b87f5",
            "#f472b6",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#ecf3ff" },
        },
      },
    },
  });
}

function renderChartVendasPorDia(vendas) {
  if (!els.chartVendasPorDia) return;

  destroyChart(state.charts.vendasPorDia);

  const map = new Map();

  for (const venda of vendas) {
    const date = new Date(venda.vendido_em);
    if (Number.isNaN(date.getTime())) continue;
    const label = date.toLocaleDateString("pt-BR");
    map.set(label, (map.get(label) || 0) + Number(venda.total || 0));
  }

  const labels = [...map.keys()];
  const data = [...map.values()];

  state.charts.vendasPorDia = new Chart(els.chartVendasPorDia, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Vendas por dia (R$)",
          data,
          borderColor: "#35e0c7",
          backgroundColor: "rgba(53,224,199,0.18)",
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#ecf3ff" } },
      },
      scales: {
        x: {
          ticks: { color: "#9fb0ca" },
          grid: { color: "rgba(255,255,255,0.06)" },
        },
        y: {
          ticks: { color: "#9fb0ca" },
          grid: { color: "rgba(255,255,255,0.06)" },
          beginAtZero: true,
        },
      },
    },
  });
}

function renderChartEstoqueMedicamentos(ativos) {
  if (!els.chartEstoqueMedicamentos) return;

  destroyChart(state.charts.estoqueMedicamentos);

  const ordenados = [...ativos]
    .sort((a, b) => Number(b.quantidade || 0) - Number(a.quantidade || 0))
    .slice(0, 10);

  const labels = ordenados.map((m) => m.nome);
  const data = ordenados.map((m) => Number(m.quantidade || 0));

  state.charts.estoqueMedicamentos = new Chart(els.chartEstoqueMedicamentos, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Qtd. em estoque",
          data,
          backgroundColor: "rgba(58,140,255,0.85)",
          borderRadius: 8,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#ecf3ff" } },
      },
      scales: {
        x: {
          ticks: { color: "#9fb0ca" },
          grid: { color: "rgba(255,255,255,0.06)" },
          beginAtZero: true,
        },
        y: {
          ticks: { color: "#9fb0ca" },
          grid: { color: "rgba(255,255,255,0.03)" },
        },
      },
    },
  });
}

function renderDashboard() {
  const ativos = getMedicamentosAtivos();
  const vendas = state.vendas;

  const totalVendas = vendas.length;
  const totalItensVendidos = vendas.reduce((sum, v) => sum + Number(v.quantidade || 0), 0);
  const faturamentoTotal = vendas.reduce((sum, v) => sum + Number(v.total || 0), 0);

  const now = new Date();
  const mesAtual = vendas.filter((v) => {
    const d = new Date(v.vendido_em);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const faturamentoMes = mesAtual.reduce((sum, v) => sum + Number(v.total || 0), 0);
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
  const maisVendido = ranking[0]?.nome || "—";

  if (els.kpiFaturamentoTotal) els.kpiFaturamentoTotal.textContent = formatCurrency(faturamentoTotal);
  if (els.kpiFaturamentoMes) els.kpiFaturamentoMes.textContent = formatCurrency(faturamentoMes);
  if (els.kpiVendas) els.kpiVendas.textContent = String(totalVendas);
  if (els.kpiItensVendidos) els.kpiItensVendidos.textContent = String(totalItensVendidos);
  if (els.kpiMedicamentosAtivos) els.kpiMedicamentosAtivos.textContent = String(ativos.length);
  if (els.kpiEstoqueTotal) els.kpiEstoqueTotal.textContent = String(estoqueTotal);
  if (els.kpiValorEstoque) els.kpiValorEstoque.textContent = formatCurrency(valorEstoque);
  if (els.kpiMaisVendido) els.kpiMaisVendido.textContent = maisVendido;

  renderTopVendidos(ranking);
  renderEstoqueBaixo(ativos);
  renderVencendo(ativos);
  renderFormas(ativos);
  renderUltimasVendas(vendas);
  renderCharts(ativos, vendas, ranking);
}

function renderTopVendidos(ranking) {
  if (!els.topVendidos) return;

  if (!ranking.length) {
    els.topVendidos.innerHTML = `<div class="emptyMini">Sem dados de vendas até o momento.</div>`;
    return;
  }

  els.topVendidos.innerHTML = ranking
    .slice(0, 5)
    .map(
      (item, index) => `
        <div class="rankItem">
          <div class="rankPos">${index + 1}</div>
          <div class="rankInfo">
            <strong>${item.nome}</strong>
            <span>${formatCurrency(item.total)} em vendas</span>
          </div>
          <div class="rankValue">${item.quantidade}</div>
        </div>
      `
    )
    .join("");
}

function renderEstoqueBaixo(ativos) {
  if (!els.estoqueBaixo) return;

  const baixos = ativos
    .filter((m) => Number(m.quantidade || 0) <= 5)
    .sort((a, b) => Number(a.quantidade || 0) - Number(b.quantidade || 0))
    .slice(0, 6);

  if (!baixos.length) {
    els.estoqueBaixo.innerHTML = `<div class="emptyMini">Nenhum item com estoque baixo.</div>`;
    return;
  }

  els.estoqueBaixo.innerHTML = baixos
    .map(
      (m) => `
        <div class="listItem">
          <div class="listItemMain">
            <strong>${m.nome}</strong>
            <span>${m.forma || "Forma não informada"}</span>
          </div>
          <div class="listItemSide">${Number(m.quantidade || 0)} un.</div>
        </div>
      `
    )
    .join("");
}

function renderVencendo(ativos) {
  if (!els.vencendoLista) return;

  const vencendo = ativos
    .map((m) => ({ ...m, dias: daysUntil(m.validade) }))
    .filter((m) => m.dias !== null && m.dias <= 30)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 6);

  if (!vencendo.length) {
    els.vencendoLista.innerHTML = `<div class="emptyMini">Nenhum medicamento próximo do vencimento.</div>`;
    return;
  }

  els.vencendoLista.innerHTML = vencendo
    .map(
      (m) => `
        <div class="listItem">
          <div class="listItemMain">
            <strong>${m.nome}</strong>
            <span>Validade: ${formatDate(m.validade)}</span>
          </div>
          <div class="listItemSide">${m.dias < 0 ? "Vencido" : `${m.dias} dia(s)`}</div>
        </div>
      `
    )
    .join("");
}

function renderFormas(ativos) {
  if (!els.formasDistribuicao) return;

  const map = new Map();
  for (const item of ativos) {
    const key = item.forma || "Não informado";
    map.set(key, (map.get(key) || 0) + Number(item.quantidade || 0));
  }

  const rows = [...map.entries()]
    .map(([forma, quantidade]) => ({ forma, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);

  if (!rows.length) {
    els.formasDistribuicao.innerHTML = `<div class="emptyMini">Sem dados para exibir.</div>`;
    return;
  }

  const max = rows[0].quantidade || 1;

  els.formasDistribuicao.innerHTML = rows
    .map(
      (row) => `
        <div class="barItem">
          <div class="barLabel">${row.forma}</div>
          <div class="barTrack">
            <div class="barFill" style="width:${(row.quantidade / max) * 100}%"></div>
          </div>
          <div class="barValue">${row.quantidade}</div>
        </div>
      `
    )
    .join("");
}

function renderUltimasVendas(vendas) {
  if (!els.ultimasVendasTable) return;

  const ultimas = [...vendas]
    .sort((a, b) => new Date(b.vendido_em) - new Date(a.vendido_em))
    .slice(0, 8);

  if (!ultimas.length) {
    els.ultimasVendasTable.innerHTML = `
      <tr>
        <td colspan="5" class="tableEmpty">Nenhuma venda registrada.</td>
      </tr>
    `;
    return;
  }

  els.ultimasVendasTable.innerHTML = ultimas
    .map(
      (v) => `
        <tr>
          <td>${v.nome || "Medicamento sem nome"}</td>
          <td>${Number(v.quantidade || 0)}</td>
          <td>${formatCurrency(v.preco_unitario)}</td>
          <td>${formatCurrency(v.total)}</td>
          <td>${formatDateTime(v.vendido_em)}</td>
        </tr>
      `
    )
    .join("");
}

async function refreshAll(options = {}) {
  const keepView = options.keepView || state.currentView || "dashboardView";
  const keepTab = options.keepTab || state.currentTab || "ativos";

  try {
    await loadMedicamentos();
    await loadVendas();

    state.currentView = keepView;
    state.currentTab = keepTab;
    persistState();

    renderDashboard();
    setView(keepView);
    setMedicamentosTab(keepTab);
  } catch (error) {
    showToast(error.message || "Erro ao carregar dados.");
    console.error(error);
  }
}

async function handleMedicamentoSubmit(event) {
  event.preventDefault();

  try {
    const payload = getMedicamentoFormData();
    validateMedicamento(payload);

    if (els.medId?.value) {
      await apiFetch(`/medicamentos/${els.medId.value}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Medicamento atualizado com sucesso.");
    } else {
      await apiFetch("/medicamentos", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Medicamento cadastrado com sucesso.");
    }

    clearMedicamentoForm();
    goToMedicamentos(state.currentTab);
    await refreshAll({ keepView: "medicamentosView", keepTab: state.currentTab });
  } catch (error) {
    showToast(error.message || "Erro ao salvar medicamento.");
  }
}

async function handleTableClick(event) {
  const button = event.target.closest("button");
  if (!button) return;

  const editId = button.getAttribute("data-edit");
  const deleteId = button.getAttribute("data-delete");
  const restoreId = button.getAttribute("data-restore");

  try {
    if (editId) {
      const medicamento = state.medicamentos.find((m) => String(m.id) === String(editId));
      if (!medicamento) throw new Error("Medicamento não encontrado.");

      els.medId.value = medicamento.id;
      els.nome.value = medicamento.nome || "";
      els.principio_ativo.value = medicamento.principio_ativo || "";
      els.dosagem.value = medicamento.dosagem || "";
      els.forma.value = medicamento.forma || "";
      els.fabricante.value = medicamento.fabricante || "";
      els.lote.value = medicamento.lote || "";
      els.validade.value = medicamento.validade || "";
      els.quantidade.value = medicamento.quantidade || 0;
      els.preco.value = medicamento.preco || 0;
      els.formTitle.textContent = `Editando: ${medicamento.nome}`;
      goToMedicamentos(state.currentTab);
      showToast(`Editando ${medicamento.nome}`);
      return;
    }

    if (deleteId) {
      const ok = window.confirm("Deseja realmente excluir este medicamento?");
      if (!ok) return;

      await apiFetch(`/medicamentos/${deleteId}`, { method: "DELETE" });
      showToast("Medicamento excluído com sucesso.");
      await refreshAll({ keepView: "medicamentosView", keepTab: "ativos" });
      return;
    }

    if (restoreId) {
      await apiFetch(`/medicamentos/${restoreId}/restaurar`, { method: "PATCH" });
      showToast("Medicamento restaurado com sucesso.");
      await refreshAll({ keepView: "medicamentosView", keepTab: "excluidos" });
    }
  } catch (error) {
    showToast(error.message || "Erro ao processar ação.");
  }
}

async function handleVendaSubmit(event) {
  event.preventDefault();

  try {
    const medicamento_id = Number(els.vendaMedicamento?.value || 0);
    const quantidade = Number(els.vendaQuantidade?.value || 0);
    const preco_unitario = Number(els.vendaPreco?.value || 0);

    if (!medicamento_id) throw new Error("Selecione um medicamento.");
    if (quantidade <= 0) throw new Error("Informe uma quantidade válida.");
    if (preco_unitario < 0) throw new Error("Informe um preço válido.");

    await apiFetch("/vendas", {
      method: "POST",
      body: JSON.stringify({
        medicamento_id,
        quantidade,
        preco_unitario,
      }),
    });

    if (els.vendaForm) els.vendaForm.reset();
    showToast("Venda registrada com sucesso.");
    await refreshAll({ keepView: state.currentView, keepTab: state.currentTab });
  } catch (error) {
    showToast(error.message || "Erro ao registrar venda.");
  }
}

function setupEvents() {
  els.navDashboard?.addEventListener("click", () => setView("dashboardView"));
  els.navMedicamentos?.addEventListener("click", () => goToMedicamentos(state.currentTab));

  els.goToMedicamentosBtn?.addEventListener("click", () => {
    goToMedicamentos("ativos");
    clearMedicamentoForm();
  });

  els.refreshAllBtn?.addEventListener("click", () =>
    refreshAll({ keepView: state.currentView, keepTab: state.currentTab })
  );

  els.reloadMedicamentosBtn?.addEventListener("click", () =>
    refreshAll({ keepView: "medicamentosView", keepTab: state.currentTab })
  );

  els.tabAtivos?.addEventListener("click", () => goToMedicamentos("ativos"));
  els.tabExcluidos?.addEventListener("click", () => goToMedicamentos("excluidos"));

  els.searchInput?.addEventListener("input", renderMedicamentosTable);

  els.cancelEditBtn?.addEventListener("click", () => {
    clearMedicamentoForm();
    goToMedicamentos(state.currentTab);
    showToast("Edição cancelada.");
  });

  els.medForm?.addEventListener("submit", handleMedicamentoSubmit);
  els.medTableBody?.addEventListener("click", handleTableClick);
  els.vendaForm?.addEventListener("submit", handleVendaSubmit);

  els.vendaMedicamento?.addEventListener("change", () => {
    const selected = els.vendaMedicamento.selectedOptions[0];
    if (!selected) return;
    const preco = selected.getAttribute("data-preco");
    if (preco && els.vendaPreco) {
      els.vendaPreco.value = Number(preco).toFixed(2);
    }
  });
}

async function init() {
  setupEvents();
  setView(state.currentView);
  setMedicamentosTab(state.currentTab);
  await refreshAll({ keepView: state.currentView, keepTab: state.currentTab });
}

init();