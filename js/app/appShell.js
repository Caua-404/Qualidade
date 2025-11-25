// js/app/appShell.js

(function () {
  const userNameEl = document.getElementById('userName');
  const userRoleEl = document.getElementById('userRole');
  const logoutButton = document.getElementById('logoutButton');
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');

  const usuario = carregarUsuario();

  if (!usuario) {
    window.location.href = 'login.html';
    return;
  }

  preencherUsuario(usuario);
  configurarNavegacao();
  configurarLogout();
  aplicarPermissoes(usuario);

  // ===== FUNÇÕES =====

  function carregarUsuario() {
    const sessionData = sessionStorage.getItem('cq_usuario');
    const localData = localStorage.getItem('cq_usuario');

    try {
      if (sessionData) return JSON.parse(sessionData);
      if (localData) return JSON.parse(localData);
    } catch (err) {
      console.error('Erro ao ler dados do usuário:', err);
    }
    return null;
  }

  function preencherUsuario(usuario) {
    if (userNameEl) {
      userNameEl.textContent = usuario.nome || usuario.email || 'Usuário';
    }
    if (userRoleEl) {
      userRoleEl.textContent = usuario.perfil || '';
    }
  }

  function configurarNavegacao() {
    navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const viewId = btn.getAttribute('data-view');
        if (!viewId) return;

        navItems.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        views.forEach((v) => {
          if (v.id === viewId) {
            v.classList.add('active');
          } else {
            v.classList.remove('active');
          }
        });
      });
    });
  }

  function configurarLogout() {
    if (!logoutButton) return;
    logoutButton.addEventListener('click', () => {
      sessionStorage.removeItem('cq_usuario');
      localStorage.removeItem('cq_usuario');
      window.location.href = 'login.html';
    });
  }

  function aplicarPermissoes(usuario) {
    // Oculta itens de menu que exigem perfil específico
    navItems.forEach((btn) => {
      const perfilNecessario = btn.getAttribute('data-perfil');
      if (!perfilNecessario) return;

      if (perfilNecessario === 'SUPERVISOR' && usuario.perfil === 'OPERADOR') {
        btn.style.display = 'none';

        if (btn.classList.contains('active')) {
          btn.classList.remove('active');

          const registroBtn = document.querySelector(
            '.nav-item[data-view="view-registro"]'
          );
          const registroView = document.getElementById('view-registro');
          if (registroBtn && registroView) {
            registroBtn.classList.add('active');
            views.forEach((v) => v.classList.remove('active'));
            registroView.classList.add('active');
          }
        }
      }
    });

    // Painel do supervisor na área de registro
    const supervisorPanel = document.getElementById('supervisorPanel');
    if (supervisorPanel) {
      supervisorPanel.hidden = usuario.perfil === 'OPERADOR';
    }
  }

  function preencherUsuario(usuario) {
  const nameEl = document.getElementById("userName");
  const roleEl = document.getElementById("userRole");
  const badgeEl = document.getElementById("logoutButton");

  if (nameEl) nameEl.textContent = usuario.nome || "";
  if (roleEl) roleEl.textContent = usuario.perfil || "";

  if (badgeEl) {
    badgeEl.classList.remove("badge-supervisor", "badge-operador");

    if (usuario.perfil === "SUPERVISOR") {
      badgeEl.classList.add("badge-supervisor");
      badgeEl.title = "Sair (supervisor)";
    } else {
      // qualquer outro perfil trata como operador
      badgeEl.classList.add("badge-operador");
      badgeEl.title = "Sair (operador)";
    }
  }
}

})();
