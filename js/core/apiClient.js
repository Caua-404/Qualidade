// js/core/apiClient.js

// URL da API (Apps Script) - depois vamos trocar quando tiver o back-end real
const API_BASE_URL = 'https://script.google.com/macros/s/SEU_ID_AQUI/exec';

// Modo de desenvolvimento: usa respostas "mock" no front.
// Quando conectar no Apps Script, mude para false.
const USE_MOCK_API = true;

// Usuários de teste (simula a aba "Usuarios" da planilha)
const MOCK_USERS = [
  {
    email: 'operador.teste@frigo.com',
    nome: 'Operador Teste',
    perfil: 'OPERADOR',
  },
  {
    email: 'supervisor.teste@frigo.com',
    nome: 'Supervisor Teste',
    perfil: 'SUPERVISOR',
  },
  {
    email: 'gestor.teste@frigo.com',
    nome: 'Gestor Teste',
    perfil: 'GESTOR',
  },
];

// expõe para outros scripts (registro.js usa)
if (typeof window !== 'undefined') {
  window.MOCK_USERS = MOCK_USERS;
}

/**
 * Cliente genérico para chamadas de API.
 * action: string que representa a ação (ex: "login")
 * payload: objeto com dados
 */
async function apiRequest(action, payload = {}) {
  if (USE_MOCK_API) {
    return mockApiRequest(action, payload);
  }

  const url = `${API_BASE_URL}?acao=${encodeURIComponent(action)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Simulação local de API para ambiente de desenvolvimento.
 * NÃO usar em produção.
 */
function mockApiRequest(action, payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      switch (action) {
        case 'login': {
          const email = (payload.email || '').toLowerCase().trim();

          if (!email || !email.includes('@') || !email.includes('.')) {
            return resolve({
              ok: false,
              erro: 'E-mail inválido.',
            });
          }

          const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email);

          if (!user) {
            return resolve({
              ok: false,
              erro:
                'Usuário não autorizado neste ambiente de testes. Use um e-mail de teste válido.',
            });
          }

          return resolve({
            ok: true,
            usuario: user,
          });
        }

        default:
          return resolve({
            ok: false,
            erro: `Ação mock não implementada: ${action}`,
          });
      }
    }, 400);
  });
}
