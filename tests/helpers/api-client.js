/**
 * tests/helpers/api-client.js
 * Cliente de API para pruebas Playwright (peticiones directas al backend)
 */

export const API = 'http://localhost:3000';

/**
 * Realiza una petición autenticada al API con manejo de cookies y CSRF.
 * Retorna { status, data, cookies, csrfToken }
 */
export async function loginAdmin(request) {
  const response = await request.post(`${API}/auth/login`, {
    data: { email: 'admin@esports.com', password: 'admin123' }
  });
  const data = await response.json();
  return {
    status: response.status(),
    data,
    csrfToken: data.csrfToken
  };
}

export async function loginPublic(request, email, password) {
  const response = await request.post(`${API}/auth/login`, {
    data: { email, password }
  });
  const data = await response.json();
  return {
    status: response.status(),
    data,
    csrfToken: data.csrfToken
  };
}

export async function registerUser(request, nombre, email, password) {
  const response = await request.post(`${API}/auth/register`, {
    data: { nombre, email, password }
  });
  const data = await response.json();
  return {
    status: response.status(),
    data,
    csrfToken: data.csrfToken
  };
}
