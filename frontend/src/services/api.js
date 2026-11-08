/**
 * Cliente API con soporte para Cookies HTTP-Only y Protección CSRF (Meta 4.2)
 * Autenticación local: sin Google OAuth, sin API Key obligatoria
 */

const API_BASE = '/api/v1';
const AUTH_BASE = '/auth';

// Estado del token CSRF (sincronizado con localStorage)
let csrfToken = localStorage.getItem('esports_csrf_token') || '';

export const setCsrfToken = (token) => {
  csrfToken = token || '';
  if (token) {
    localStorage.setItem('esports_csrf_token', token);
  } else {
    localStorage.removeItem('esports_csrf_token');
  }
};

export const getCsrfToken = () => csrfToken;

/**
 * Función central de peticiones:
 * - credentials: 'include' para enviar cookie HTTP-Only jwt_token
 * - x-csrf-token en cabecera para mutaciones
 */
async function apiRequest(endpoint, options = {}, baseUrl = API_BASE) {
  const url = `${baseUrl}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const esMutacion = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  if (esMutacion && csrfToken && !headers['x-csrf-token']) {
    headers['x-csrf-token'] = csrfToken;
  }

  const config = {
    ...options,
    method,
    headers,
    credentials: 'include'
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    throw new Error(`Error de red al conectar con el servidor: ${err.message}`);
  }

  if (response.status === 204) return null;

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || data?.mensaje || `Error HTTP ${response.status}: ${response.statusText}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function authRequest(endpoint, options = {}) {
  return apiRequest(endpoint, options, AUTH_BASE);
}

export const api = {
  // ── Autenticación ────────────────────────────────────────────────────────
  auth: {
    /**
     * Login local con email + password
     */
    login: async (email, password) => {
      const data = await authRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data?.csrfToken) setCsrfToken(data.csrfToken);
      return data;
    },

    /**
     * Registro de nuevo usuario (rol Public)
     */
    register: async (nombre, email, password) => {
      const data = await authRequest('/register', {
        method: 'POST',
        body: JSON.stringify({ nombre, email, password })
      });
      if (data?.csrfToken) setCsrfToken(data.csrfToken);
      return data;
    },

    logout: async () => {
      try {
        await authRequest('/logout', { method: 'POST' });
      } finally {
        setCsrfToken('');
      }
    },

    verify: async () => {
      const data = await authRequest('/verify');
      if (data?.csrfToken) setCsrfToken(data.csrfToken);
      return data;
    },

    listarUsuarios: () => authRequest('/usuarios')
  },

  // ── Jugadores CRUD ───────────────────────────────────────────────────────
  jugadores: {
    getAll: (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.rol && params.rol !== 'Todos') searchParams.append('rol', params.rol);
      if (params.estado && params.estado !== 'Todos') searchParams.append('estado', params.estado);
      if (params.search && params.search.trim()) searchParams.append('search', params.search.trim());
      const query = searchParams.toString();
      return apiRequest(`/jugadores${query ? `?${query}` : ''}`);
    },
    getById: (id) => apiRequest(`/jugadores/${id}`),
    create: (jugador) => apiRequest('/jugadores', { method: 'POST', body: JSON.stringify(jugador) }),
    update: (id, jugador) => apiRequest(`/jugadores/${id}`, { method: 'PUT', body: JSON.stringify(jugador) }),
    delete: (id) => apiRequest(`/jugadores/${id}`, { method: 'DELETE' })
  },

  // ── Rosters CRUD ─────────────────────────────────────────────────────────
  rosters: {
    getAll: (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.tipo && params.tipo !== 'Todos') searchParams.append('tipo', params.tipo);
      if (params.temporada && params.temporada !== 'Todos') searchParams.append('temporada', params.temporada);
      const query = searchParams.toString();
      return apiRequest(`/rosters${query ? `?${query}` : ''}`);
    },
    getById: (id) => apiRequest(`/rosters/${id}`),
    create: (roster) => apiRequest('/rosters', { method: 'POST', body: JSON.stringify(roster) }),
    update: (id, roster) => apiRequest(`/rosters/${id}`, { method: 'PUT', body: JSON.stringify(roster) }),
    delete: (id) => apiRequest(`/rosters/${id}`, { method: 'DELETE' })
  },

  // ── Roster-Jugadores ─────────────────────────────────────────────────────
  rosterJugadores: {
    getJugadores: (rosterId) => apiRequest(`/rosters/${rosterId}/jugadores`),
    assign: (rosterId, { id_jugador, rol_en_roster }) =>
      apiRequest(`/rosters/${rosterId}/jugadores`, {
        method: 'POST',
        body: JSON.stringify({ id_jugador, rol_en_roster })
      }),
    updateRol: (rosterId, jugadorId, rol_en_roster) =>
      apiRequest(`/rosters/${rosterId}/jugadores/${jugadorId}`, {
        method: 'PUT',
        body: JSON.stringify({ rol_en_roster })
      }),
    remove: (rosterId, jugadorId) =>
      apiRequest(`/rosters/${rosterId}/jugadores/${jugadorId}`, { method: 'DELETE' })
  },

  // ── Endpoints Auxiliares ─────────────────────────────────────────────────
  auxiliares: {
    getRoles: () => apiRequest('/roles'),
    getEstados: () => apiRequest('/estados'),
    getTiposRoster: () => apiRequest('/tipos-roster'),
    getHealth: () => apiRequest('/health')
  },

  // ── Prueba de Seguridad CSRF (sin token, para demo) ──────────────────────
  probarMutacionSinCsrf: async () => {
    return apiRequest('/jugadores', {
      method: 'POST',
      headers: { 'x-csrf-token': '' },
      body: JSON.stringify({ nickname: 'TestCsrf', rol: 'Mid' })
    });
  }
};
