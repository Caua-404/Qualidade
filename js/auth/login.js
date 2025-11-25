// js/auth/login.js

(function () {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const keepConnectedInput = document.getElementById('keepConnected');
  const loginButton = document.getElementById('loginButton');
  const loginError = document.getElementById('loginError');

  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    limparErro();

    const email = (emailInput.value || '').trim();
    const senha = (passwordInput.value || '').trim(); // apenas UX, não vai para o back

    if (!email || !email.includes('@') || !email.includes('.')) {
      mostrarErro('Informe um e-mail corporativo válido.');
      return;
    }

    if (!senha) {
      mostrarErro('Informe a senha para continuar.');
      return;
    }

    try {
      travarBotao(true, 'Entrando...');

      if (typeof apiRequest !== 'function') {
        throw new Error('Função apiRequest não encontrada.');
      }

      const resposta = await apiRequest('login', { email });

      if (!resposta || !resposta.ok) {
        const msg =
          (resposta && resposta.erro) ||
          'Não foi possível fazer login. Verifique os dados.';
        mostrarErro(msg);
        travarBotao(false);
        return;
      }

      const usuario = resposta.usuario;

      sessionStorage.setItem('cq_usuario', JSON.stringify(usuario));

      if (keepConnectedInput && keepConnectedInput.checked) {
        localStorage.setItem('cq_usuario', JSON.stringify(usuario));
      } else {
        localStorage.removeItem('cq_usuario');
      }

      window.location.href = 'app.html';
    } catch (err) {
      console.error('Erro no login:', err);
      mostrarErro('Erro inesperado ao fazer login. Tente novamente.');
    } finally {
      travarBotao(false);
    }
  });

  function mostrarErro(mensagem) {
    if (!loginError) return;
    loginError.hidden = false;
    loginError.textContent = mensagem;
  }

  function limparErro() {
    if (!loginError) return;
    loginError.hidden = true;
    loginError.textContent = '';
  }

  function travarBotao(travar, textoWhileLoading) {
    if (!loginButton) return;
    loginButton.disabled = travar;
    if (travar && textoWhileLoading) {
      loginButton.dataset.originalText = loginButton.textContent;
      loginButton.textContent = textoWhileLoading;
    } else if (!travar && loginButton.dataset.originalText) {
      loginButton.textContent = loginButton.dataset.originalText;
      delete loginButton.dataset.originalText;
    }
  }
})();

