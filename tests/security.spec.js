/**
 * tests/security.spec.js
 * Suite de pruebas: Seguridad JWT + CSRF
 */
import { test, expect } from '@playwright/test';
import { API } from './helpers/api-client.js';

// ── PROTECCIÓN JWT ──────────────────────────────────────────────────────────

test.describe('Seguridad: JWT requerido para mutaciones', () => {
  test('POST /api/v1/jugadores sin JWT retorna 401', async ({ request }) => {
    // Crear un contexto limpio sin cookies para simular usuario sin sesión
    const response = await request.post(`${API}/api/v1/jugadores`, {
      headers: {
        'x-csrf-token': 'cualquier-valor'
      },
      data: { nickname: 'SinJWT', rol: 'Mid' }
    });
    expect([401, 403]).toContain(response.status());
  });

  test('PUT /api/v1/jugadores/1 sin JWT retorna 401', async ({ request }) => {
    const response = await request.put(`${API}/api/v1/jugadores/1`, {
      headers: { 'x-csrf-token': 'fake' },
      data: { nickname: 'Hack', rol: 'Mid' }
    });
    expect([401, 403]).toContain(response.status());
  });

  test('DELETE /api/v1/jugadores/1 sin JWT retorna 401', async ({ request }) => {
    const response = await request.delete(`${API}/api/v1/jugadores/1`, {
      headers: { 'x-csrf-token': 'fake' }
    });
    expect([401, 403]).toContain(response.status());
  });

  test('POST /api/v1/rosters sin JWT retorna 401', async ({ request }) => {
    const response = await request.post(`${API}/api/v1/rosters`, {
      headers: { 'x-csrf-token': 'fake' },
      data: { nombre: 'SinJWT', tipo: 'Principal', temporada: '2026' }
    });
    expect([401, 403]).toContain(response.status());
  });
});

// ── PROTECCIÓN CSRF ─────────────────────────────────────────────────────────

test.describe('Seguridad: CSRF — Token requerido en mutaciones', () => {
  let csrfToken = '';

  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@esports.com', password: 'admin123' }
    });
    const data = await loginRes.json();
    csrfToken = data.csrfToken;
  });

  test('POST /api/v1/jugadores sin x-csrf-token retorna 403', async ({ request }) => {
    // Logueado pero SIN enviar el CSRF token
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@esports.com', password: 'admin123' }
    });
    expect(loginRes.status()).toBe(200);

    const response = await request.post(`${API}/api/v1/jugadores`, {
      // No se incluye x-csrf-token
      data: { nickname: `SinCSRF_${Date.now()}`, rol: 'Mid' }
    });
    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.message || data.error || data.mensaje || '').toMatch(/CSRF/i);
  });

  test('POST /api/v1/jugadores con x-csrf-token inválido retorna 403', async ({ request }) => {
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@esports.com', password: 'admin123' }
    });
    expect(loginRes.status()).toBe(200);

    const response = await request.post(`${API}/api/v1/jugadores`, {
      headers: {
        'x-csrf-token': 'token-incorrecto-de-prueba-csrf'
      },
      data: { nickname: `CSRFInvalido_${Date.now()}`, rol: 'Top' }
    });
    expect(response.status()).toBe(403);
  });

  test('POST /api/v1/jugadores con x-csrf-token correcto — retorna 201', async ({ request }) => {
    // Este test valida que con el token correcto SÍ se permite la operación
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@esports.com', password: 'admin123' }
    });
    const loginData = await loginRes.json();
    const validCsrf = loginData.csrfToken;

    const response = await request.post(`${API}/api/v1/jugadores`, {
      headers: { 'x-csrf-token': validCsrf },
      data: {
        nickname: `CSRFValido_${Date.now()}`,
        rol: 'Support',
        estado: 'activo'
      }
    });
    expect(response.status()).toBe(201);

    // Limpiar: eliminar el jugador creado
    const created = await response.json();
    if (created.id) {
      await request.delete(`${API}/api/v1/jugadores/${created.id}`, {
        headers: { 'x-csrf-token': validCsrf }
      });
    }
  });

  test('GET /api/v1/jugadores NO requiere CSRF (es lectura pública)', async ({ request }) => {
    const response = await request.get(`${API}/api/v1/jugadores`);
    expect(response.status()).toBe(200);
  });
});

// ── CONTROL DE ACCESO POR ROL ────────────────────────────────────────────────

test.describe('Seguridad: Control de Acceso por Rol (Public vs Admin)', () => {
  let publicCsrfToken = '';

  test.beforeAll(async ({ request }) => {
    // Registrar usuario con rol Public
    const email = `security_test_${Date.now()}@test.com`;
    const regRes = await request.post(`${API}/auth/register`, {
      data: { nombre: 'Security Tester', email, password: 'password123' }
    });
    const data = await regRes.json();
    publicCsrfToken = data.csrfToken;
  });

  test('Usuario Public NO puede crear jugadores (retorna 403)', async ({ request }) => {
    // Login como Public
    const email = `public_test_${Date.now()}@test.com`;
    await request.post(`${API}/auth/register`, {
      data: { nombre: 'Public User', email, password: 'password123' }
    });
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email, password: 'password123' }
    });
    const data = await loginRes.json();

    const response = await request.post(`${API}/api/v1/jugadores`, {
      headers: { 'x-csrf-token': data.csrfToken },
      data: { nickname: `PublicHack_${Date.now()}`, rol: 'Mid' }
    });
    expect(response.status()).toBe(403);
  });

  test('Usuario Public NO puede eliminar jugadores (retorna 403)', async ({ request }) => {
    const email = `public_del_${Date.now()}@test.com`;
    await request.post(`${API}/auth/register`, {
      data: { nombre: 'Public Del', email, password: 'password123' }
    });
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email, password: 'password123' }
    });
    const data = await loginRes.json();

    const response = await request.delete(`${API}/api/v1/jugadores/1`, {
      headers: { 'x-csrf-token': data.csrfToken }
    });
    expect(response.status()).toBe(403);
  });

  test('Usuario Public NO puede listar usuarios del sistema (retorna 403)', async ({ request }) => {
    const email = `public_usr_${Date.now()}@test.com`;
    await request.post(`${API}/auth/register`, {
      data: { nombre: 'Public Usr', email, password: 'password123' }
    });
    await request.post(`${API}/auth/login`, {
      data: { email, password: 'password123' }
    });

    const response = await request.get(`${API}/auth/usuarios`);
    // Sin x-csrf-token GET pasa el middleware, pero debe validar rol Admin
    expect(response.status()).toBe(403);
  });

  test('Admin puede listar usuarios del sistema (retorna 200)', async ({ request }) => {
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@esports.com', password: 'admin123' }
    });
    const data = await loginRes.json();
    // GET /auth/usuarios usa verificarTokenYCsrf que requiere Admin
    // Para GET no valida CSRF pero sí el rol
    const response = await request.get(`${API}/auth/usuarios`);
    // Si el middleware permite GET sin CSRF check, debe retornar 200
    // Si no, 403 — aceptamos ambos según configuración
    expect(response.status()).toBe(200);
  });
});

// ── ENDPOINTS AUXILIARES (públicos) ─────────────────────────────────────────

test.describe('Seguridad: Endpoints auxiliares públicos', () => {
  test('GET /api/v1/health — retorna 200 sin autenticación', async ({ request }) => {
    const response = await request.get(`${API}/api/v1/health`);
    expect(response.status()).toBe(200);
  });

  test('GET /api/v1/roles — retorna lista de roles sin auth', async ({ request }) => {
    const response = await request.get(`${API}/api/v1/roles`);
    expect(response.status()).toBe(200);
  });

  test('GET /api/v1/estados — retorna lista de estados sin auth', async ({ request }) => {
    const response = await request.get(`${API}/api/v1/estados`);
    expect(response.status()).toBe(200);
  });

  test('GET /api/v1/tipos-roster — retorna tipos de roster sin auth', async ({ request }) => {
    const response = await request.get(`${API}/api/v1/tipos-roster`);
    expect(response.status()).toBe(200);
  });
});
