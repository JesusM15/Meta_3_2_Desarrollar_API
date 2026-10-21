/**
 * Cliente API con soporte para Cookies HTTP-Only y Protección CSRF (Meta 3.4)
 */

const API_BASE = '/api/v1';

// Estado reactivo/almacenado del token CSRF
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
 * Función central de peticiones con credentials: 'include' y header CSRF automático
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // En métodos de mutación (POST, PUT, DELETE, PATCH), inyectar cabecera CSRF requerida
  const esMutacion = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  if (esMutacion && csrfToken && !headers['x-csrf-token']) {
    headers['x-csrf-token'] = csrfToken;
  }

  const config = {
    ...options,
    method,
    headers,
    // CRÍTICO: credentials: 'include' asegura que el navegador envíe la cookie HTTP-Only jwt_token
    credentials: 'include'
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    throw new Error(`Error de red al conectar con el servidor: ${err.message}`);
  }

  // 204 No Content no contiene cuerpo JSON
  if (response.status === 204) {
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.mensaje || `Error HTTP ${response.status}: ${response.statusText}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Autenticación (JWT + CSRF)
  auth: {
    login: async (apiKey, email, password) => {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey
        },
        body: JSON.stringify({ email, password })
      });
      if (data?.csrfToken) {
        setCsrfToken(data.csrfToken);
      }
      return data;
    },
    logout: async () => {
      try {
        await apiRequest('/auth/logout', { method: 'POST' });
      } finally {
        setCsrfToken('');
      }
    },
    verify: async () => {
      const data = await apiRequest('/auth/verify', { method: 'GET' });
      if (data?.csrfToken) {
        setCsrfToken(data.csrfToken);
      }
      return data;
    }
  },

  // Jugadores CRUD
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
    create: (jugador) => apiRequest('/jugadores', {
      method: 'POST',
      body: JSON.stringify(jugador)
    }),
    update: (id, jugador) => apiRequest(`/jugadores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jugador)
    }),
    delete: (id) => apiRequest(`/jugadores/${id}`, {
      method: 'DELETE'
    })
  },

  // Rosters CRUD
  rosters: {
    getAll: (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.tipo && params.tipo !== 'Todos') searchParams.append('tipo', params.tipo);
      if (params.temporada && params.temporada !== 'Todos') searchParams.append('temporada', params.temporada);
      const query = searchParams.toString();
      return apiRequest(`/rosters${query ? `?${query}` : ''}`);
    },
    getById: (id) => apiRequest(`/rosters/${id}`),
    create: (roster) => apiRequest('/rosters', {
      method: 'POST',
      body: JSON.stringify(roster)
    }),
    update: (id, roster) => apiRequest(`/rosters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roster)
    }),
    delete: (id) => apiRequest(`/rosters/${id}`, {
      method: 'DELETE'
    })
  },

  // Asignaciones de Roster (Tabla Intermedia)
  rosterJugadores: {
    getJugadores: (rosterId) => apiRequest(`/rosters/${rosterId}/jugadores`),
    assign: (rosterId, { id_jugador, rol_en_roster }) => apiRequest(`/rosters/${rosterId}/jugadores`, {
      method: 'POST',
      body: JSON.stringify({ id_jugador, rol_en_roster })
    }),
    updateRol: (rosterId, jugadorId, rol_en_roster) => apiRequest(`/rosters/${rosterId}/jugadores/${jugadorId}`, {
      method: 'PUT',
      body: JSON.stringify({ rol_en_roster })
    }),
    remove: (rosterId, jugadorId) => apiRequest(`/rosters/${rosterId}/jugadores/${jugadorId}`, {
      method: 'DELETE'
    })
  },

  // Endpoints Auxiliares
  auxiliares: {
    getRoles: () => apiRequest('/roles'),
    getEstados: () => apiRequest('/estados'),
    getTiposRoster: () => apiRequest('/tipos-roster'),
    getHealth: () => apiRequest('/health')
  },

  // Prueba de Seguridad CSRF intencionalmente sin token para demostración
  probarMutacionSinCsrf: async () => {
    return apiRequest('/jugadores', {
      method: 'POST',
      headers: {
        'x-csrf-token': '' // se omite el token
      },
      body: JSON.stringify({ nickname: 'TestCsrf', rol: 'Mid' })
    });
  }
};
