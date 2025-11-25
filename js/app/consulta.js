// js/app/consulta.js
(function () {
  const API_URL = window.CQ_API_URL;
  if (!API_URL) {
    console.warn("CQ_API_URL não definido para consulta.");
    return;
  }

  const tabelaBody = document.getElementById("consultaTabelaBody");
  const btnAtualizar = document.getElementById("btnConsultaAtualizar");
  const navConsulta = document.querySelector('.nav-item[data-view="view-consulta"]');

  if (!tabelaBody) return;

  async function carregarRegistros() {
    try {
      tabelaBody.innerHTML = `
        <tr><td colspan="15" class="consulta-loading">
          Carregando registros...
        </td></tr>
      `;

      const resp = await fetch(API_URL, {
        method: "GET",
        headers: { "Accept": "application/json" },
      });

      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Erro ao consultar SheetDB:", resp.status, txt);
        tabelaBody.innerHTML = `
          <tr><td colspan="15" class="consulta-empty">
            Erro ao carregar registros (HTTP ${resp.status}).
          </td></tr>
        `;
        return;
      }

      const rows = await resp.json();
      if (!rows || !rows.length) {
        tabelaBody.innerHTML = `
          <tr><td colspan="15" class="consulta-empty">
            Nenhum registro encontrado.
          </td></tr>
        `;
        return;
      }

      // ordena por data desc + timestamp (opcional)
      rows.sort((a, b) => {
        const da = (a.DataAbate || "") + (a.TimestampEnvio || "");
        const db = (b.DataAbate || "") + (b.TimestampEnvio || "");
        return db.localeCompare(da);
      });

      tabelaBody.innerHTML = "";
      rows.forEach((r) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${r.DataAbate || ""}</td>
          <td>${r.Regiao || ""}</td>
          <td>${r.NomeOperador || ""}</td>
          <td>${r.Perfil || ""}</td>
          <td>${r.TotalAbate || ""}</td>
          <td>${r.TotalCarcacas || ""}</td>
          <td>${r.Fezes || ""}</td>
          <td>${r.Ingesta || ""}</td>
          <td>${r.Graxa || ""}</td>
          <td>${r.Medula || ""}</td>
          <td>${r.Pelo || ""}</td>
          <td>${r.PoTrilho || ""}</td>
          <td>${r.Linfonodos || ""}</td>
          <td>${r.Vacinas || ""}</td>
          <td>${r.Outros || ""}</td>
        `;
        tabelaBody.appendChild(tr);
      });
    } catch (err) {
      console.error("Erro geral na consulta:", err);
      tabelaBody.innerHTML = `
        <tr><td colspan="15" class="consulta-empty">
          Erro inesperado ao carregar registros.
        </td></tr>
      `;
    }
  }

  // botão "Atualizar"
  if (btnAtualizar) {
    btnAtualizar.addEventListener("click", carregarRegistros);
  }

  // quando trocar para view-consulta, recarrega
  document.addEventListener("cq_view_change", (ev) => {
    if (ev.detail?.viewId === "view-consulta") {
      carregarRegistros();
    }
  });

  // se o usuário abrir a página direto já na consulta (caso raro)
  if (navConsulta && navConsulta.classList.contains("active")) {
    carregarRegistros();
  }
})();
