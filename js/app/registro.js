// js/app/registro.js
(function () {
  "use strict";

  // =========================
  // CONSTANTES
  // =========================
  const CONTAMINACOES = [
    "Fezes",
    "Ingesta",
    "Graxa",
    "Medula",
    "Pelo",
    "Pó de trilho",
    "Linfonodos",
    "Vacinas",
    "Outros",
  ];

  const API_URL = window.CQ_API_URL || ""; // definido em apiConfig.js

  // =========================
  // ELEMENTOS
  // =========================
  const dataAbateInput = document.getElementById("dataAbate");
  const totalAbateInput = document.getElementById("totalAbate");
  const totalCarcacasInput = document.getElementById("totalCarcacas");

  const gridEl = document.getElementById("contaminacaoGrid");
  const regiaoButtons = document.querySelectorAll(".regiao-btn");
  const btnEnviarRegiao = document.getElementById("btnEnviarRegiao");
  const registroMsg = document.getElementById("registroMsg");
  const themeToggle = document.getElementById("themeToggle");

  const supervisorPanel = document.getElementById("supervisorPanel");
  const superRegiaoSelect = document.getElementById("superRegiao");
  const superOperadorSelect = document.getElementById("superOperador");
  const btnLiberarEdicao = document.getElementById("btnLiberarEdicao");

  if (!gridEl) return; // não está na view de registro

  // =========================
  // ESTADO
  // =========================
  let regiaoAtual = "TRASEIRO";

  const dadosRegiao = {
    TRASEIRO: {},
    DIANTEIRO: {},
  };

  const usuario = (() => {
    try {
      const s =
        sessionStorage.getItem("cq_usuario") ||
        localStorage.getItem("cq_usuario");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  // =========================
  // INICIALIZAÇÃO
  // =========================
  inicializarTema();
  inicializarData();
  montarGrid();
  configurarEventos();
  configurarSupervisorUI();
  verificarPermissaoPorData();
  atualizarMensagem();

  // =========================
  // FUNÇÕES BASE
  // =========================
  function getHojeISO() {
    // usa fuso local mas é suficiente aqui
    return new Date().toISOString().slice(0, 10);
  }

  function getDataChave() {
    if (!dataAbateInput || !dataAbateInput.value) {
      return getHojeISO();
    }
    return dataAbateInput.value;
  }

  function inicializarTema() {
    if (!themeToggle) return;
    themeToggle.addEventListener("click", () => {
      document.documentElement.classList.toggle("light");
      themeToggle.textContent = document.documentElement.classList.contains(
        "light"
      )
        ? "☀️"
        : "🌙";
    });
  }

  function inicializarData() {
    if (!dataAbateInput) return;

    const hoje = getHojeISO();
    if (!dataAbateInput.value) dataAbateInput.value = hoje;

    dataAbateInput.addEventListener("change", () => {
      verificarPermissaoPorData();
      atualizarMensagem();
      limparCamposContaminacao();
    });

    // se já tiver valor de abate, recalcula carcaças
    if (totalAbateInput && totalCarcacasInput && totalAbateInput.value) {
      const v = Number(totalAbateInput.value) || 0;
      totalCarcacasInput.value = Math.floor(v / 2);
    }
  }

  function montarGrid() {
    gridEl.innerHTML = "";

    CONTAMINACOES.forEach((nome, index) => {
      const label = document.createElement("div");
      label.className = "contaminacao-item-label";
      label.textContent = nome;

      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.placeholder = "0";
      input.className = "contaminacao-input";
      input.dataset.idx = String(index);

      const valor = dadosRegiao[regiaoAtual][index];
      if (typeof valor === "number") input.value = valor;

      input.addEventListener("input", () => {
        const v = Number(input.value) || 0;
        dadosRegiao[regiaoAtual][index] = v;
      });

      gridEl.appendChild(label);
      gridEl.appendChild(input);
    });
  }

  // =========================
  // REGRAS DE DATA
  // =========================
  function verificarPermissaoPorData() {
    const hoje = getHojeISO();
    const dataSelecionada = getDataChave();

    const ehHoje = dataSelecionada === hoje;

    // só permite editar/enviar se for a data de hoje
    toggleEdicao(ehHoje);

    if (!ehHoje) {
      if (registroMsg) {
        registroMsg.textContent =
          "Somente é permitido registrar/alterar dados na data do dia. " +
          "Selecione a data de hoje para inserir novos registros.";
      }
    } else {
      if (registroMsg) registroMsg.textContent = "";
    }
  }

  function toggleEdicao(ativo) {
    // ativa/desativa campos de abate, carcaças, contaminações e botão enviar
    if (totalAbateInput) totalAbateInput.disabled = !ativo;
    if (totalCarcacasInput) totalCarcacasInput.disabled = !ativo;

    const inputs = gridEl.querySelectorAll("input");
    inputs.forEach((input) => {
      input.disabled = !ativo;
    });

    if (btnEnviarRegiao) btnEnviarRegiao.disabled = !ativo;
  }

  // =========================
  // EVENTOS
  // =========================
  function configurarEventos() {
    // cálculo automático de carcaças (abate / 2)
    if (totalAbateInput && totalCarcacasInput) {
      totalAbateInput.addEventListener("input", () => {
        const v = Number(totalAbateInput.value) || 0;
        totalCarcacasInput.value = Math.floor(v * 2);
      });
    }

    // troca de região
    regiaoButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const r = btn.dataset.regiao;
        if (!r || r === regiaoAtual) return;
        regiaoAtual = r;

        regiaoButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        montarGrid();
      });
    });

    // envio do relatório
    if (btnEnviarRegiao) {
      btnEnviarRegiao.addEventListener("click", async () => {
        if (!validarCamposBasicos()) return;

        const ok = await enviarRelatorioParaSheets();
        if (ok) {
          atualizarMensagem("Registro enviado com sucesso.");
          limparCamposContaminacao();
        } else {
          atualizarMensagem(
            "Falha ao enviar para o Google Sheets. Tente novamente."
          );
        }
      });
    }

    // botão de liberação do painel (só visual, já que não travamos mais nada)
    if (btnLiberarEdicao && superRegiaoSelect) {
      btnLiberarEdicao.addEventListener("click", () => {
        const regiao = superRegiaoSelect.value || "TRASEIRO";
        const operadorEmail = superOperadorSelect
          ? superOperadorSelect.value
          : "";
        atualizarMensagem(
          operadorEmail
            ? `Supervisor marcou a região ${regiao.toLowerCase()} como revisada para ${operadorEmail}.`
            : `Supervisor marcou a região ${regiao.toLowerCase()} como revisada.`
        );
      });
    }
  }

  function atualizarMensagem(texto) {
    if (!registroMsg) return;
    registroMsg.textContent = texto || "";
  }

  function limparCamposContaminacao() {
    Object.keys(dadosRegiao).forEach((reg) => {
      dadosRegiao[reg] = {};
    });
    montarGrid();
  }

  // =========================
  // VALIDAÇÃO + ENVIO
  // =========================
  function validarCamposBasicos() {
    const hoje = getHojeISO();
    const dataSel = getDataChave();

    if (!dataSel) {
      alert("Informe a data do abate.");
      dataAbateInput && dataAbateInput.focus();
      return false;
    }

    if (dataSel !== hoje) {
      alert(
        "Só é permitido registrar/alterar dados na data de hoje. Ajuste a data para continuar."
      );
      return false;
    }

    const total = Number(totalAbateInput.value || 0);
    if (!total || total <= 0) {
      alert("Informe o total de animais abatidos.");
      totalAbateInput && totalAbateInput.focus();
      return false;
    }

    return true;
  }

  async function enviarRelatorioParaSheets() {
    if (!API_URL) {
      console.error("CQ_API_URL (SheetDB) não configurado.");
      return false;
    }

    try {
      const dataAbate = getDataChave();
      const totalAbate = Number(totalAbateInput.value || 0);
      const totalCarcacas = Number(totalCarcacasInput.value || 0);

      const contaminacoes = {};
      const inputs = gridEl.querySelectorAll("input.contaminacao-input");
      inputs.forEach((input) => {
        const idx = Number(input.dataset.idx || -1);
        const tipo = CONTAMINACOES[idx];
        if (!tipo) return;
        const valor = Number(input.value || 0);
        contaminacoes[tipo] = valor;
      });

      // Valor “bonito” para Regiao
      const valorRegiao =
        regiaoAtual === "TRASEIRO"
          ? "Traseiro"
          : regiaoAtual === "DIANTEIRO"
          ? "Dianteiro"
          : regiaoAtual || "";

      const row = {
        DataAbate: dataAbate,
        EmailOperador: usuario?.email || "",
        NomeOperador: usuario?.nome || "",
        Perfil: usuario?.perfil || "",
        TotalAbate: totalAbate,
        TotalCarcacas: totalCarcacas,
        Fezes: contaminacoes["Fezes"] || 0,
        Ingesta: contaminacoes["Ingesta"] || 0,
        Graxa: contaminacoes["Graxa"] || 0,
        Medula: contaminacoes["Medula"] || 0,
        Pelo: contaminacoes["Pelo"] || 0,
        PoTrilho: contaminacoes["Pó de trilho"] || 0,
        Linfonodos: contaminacoes["Linfonodos"] || 0,
        Vacinas: contaminacoes["Vacinas"] || 0,
        Outros: contaminacoes["Outros"] || 0,
        TimestampEnvio: new Date().toISOString(),
      };

      // Blindagem da coluna de região (variações de header)
      row.Regiao = valorRegiao;
      row["Regiao "] = valorRegiao;
      row["Região"] = valorRegiao;

      const body = { data: [row] };

      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        console.error("Erro HTTP SheetDB:", resp.status);
        const errText = await resp.text();
        console.error("Resposta SheetDB:", errText);
        return false;
      }

      const data = await resp.json().catch(() => ({}));
      console.log("SheetDB OK:", data);
      return true;
    } catch (err) {
      console.error("Erro ao enviar para SheetDB:", err);
      return false;
    }
  }

  // =========================
  // SUPERVISOR – VISUAL
  // =========================
  function configurarSupervisorUI() {
    const perfil = usuario?.perfil || "";

    // painel de supervisor só aparece se for SUPERVISOR
    if (supervisorPanel) {
      supervisorPanel.hidden = perfil !== "SUPERVISOR";
    }

    // preencher combo de operadores
    if (perfil === "SUPERVISOR") {
      preencherOperadoresSupervisor();
    }
  }

  function preencherOperadoresSupervisor() {
    if (!superOperadorSelect) return;

    const MOCK_USERS = [
      {
        nome: "Operador Teste",
        email: "operador.teste@frigo.com",
      },
      {
        nome: "Operador João",
        email: "operador.joao@frigo.com",
      },
      {
        nome: "Operador Ana",
        email: "operador.ana@frigo.com",
      },
    ];

    superOperadorSelect.innerHTML = "";
    const optDefault = document.createElement("option");
    optDefault.value = "";
    optDefault.textContent = "Selecione um operador";
    superOperadorSelect.appendChild(optDefault);

    MOCK_USERS.forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u.email;
      opt.textContent = `${u.nome} — ${u.email}`;
      superOperadorSelect.appendChild(opt);
    });
  }
})();
