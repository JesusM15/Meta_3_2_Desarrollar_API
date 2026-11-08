/**
 * tests/jugadores.spec.js
 * Suite de pruebas: Jugadores (acceso público + CRUD Admin)
 */
import { test, expect } from '@playwright/test';
import { API } from './helpers/api-client.js';

const TS = Date.now();

// ── ACCESO PÚBLICO (GET sin autenticación) ──────────────────────────────────

test.describe('Jugadores: Acceso Público (sin autenticación)', () => {
  test('GET /api/v1/jugadores — retorna lista de jugadores sin auth', async ({ request }) => {
    const response = await request.get(`${API}/api/v1/jugadores`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/v1/jugadores?rol=Mid — filtra por rol correctamente', async ({ request }) => {
    const response = await request.get(`${API}/api/v1/jugadores?rol=Mid`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    // Todos deben ser Mid si hay resultados
    data.forEach((j) => expect(j.rol).toBe('Mid'));
  });

  test('GET /api/v1/jugadores?estado=activo — filtra por estado', async ({ request }) => {
    const response = await request.get(`${API}/api/v1/jugadores?estado=activo`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    data.forEach((j) => expect(j.estado).toBe('activo'));
  });

  test('GET /api/v1/jugadores?search=Faker — búsqueda por nickname', async ({ request }) => {
    const response = await request.get(`${API}/api/v1/jugadores?search=Faker`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/v1/jugadores/:id — obtiene un jugador por ID', async ({ request }) => {
    // Primero obtener la lista para saber un ID válido
    const listRes = await request.get(`${API}/api/v1/jugadores`);
    const list = await listRes.json();
    if (list.length > 0) {
      const id = list[0].id;
      const response = await request.get(`${API}/api/v1/jugadores/${id}`);
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(id);
      expect(data).toHaveProperty('nickname');
    }
  });

  test('GET /api/v1/jugadores/9999 — ID inexistente retorna 404', async ({ request }) => {
    const response = await request.get(`${API}/api/v1/jugadores/9999`);
    expect(response.status()).toBe(404);
  });
});

// ── CRUD ADMIN ──────────────────────────────────────────────────────────────

test.describe('Jugadores: CRUD Admin', () => {
  let csrfToken = '';
  let jugadorCreatedId = null;
  const nickname = `TestPlayer_${TS}`;

  test.beforeEach(async ({ request }, testInfo) => {
    if (testInfo.title.includes("sin auth")) return;
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@esports.com', password: 'admin123' }
    });
    const data = await loginRes.json();
    csrfToken = data.csrfToken;
    expect(csrfToken).toBeTruthy();
  });

  test('POST /api/v1/jugadores — Admin crea un jugador nuevo', async ({ request }) => {
    const response = await request.post(`${API}/api/v1/jugadores`, {
      headers: { 'x-csrf-token': csrfToken },
      data: {
        nickname,
        nombre_real: 'Juan Test',
        pais: 'México',
        rol: 'Mid',
        estado: 'activo'
      }
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.nickname).toBe(nickname);
    expect(data.rol).toBe('Mid');
    jugadorCreatedId = data.id;
  });

  test('POST /api/v1/jugadores — nickname duplicado retorna 409', async ({ request }) => {
    const response = await request.post(`${API}/api/v1/jugadores`, {
      headers: { 'x-csrf-token': csrfToken },
      data: { nickname, rol: 'Top' }
    });
    expect(response.status()).toBe(409);
  });

  test('PUT /api/v1/jugadores/:id — Admin edita un jugador', async ({ request }) => {
    test.skip(!jugadorCreatedId, 'Requiere jugador creado en test anterior');

    const response = await request.put(`${API}/api/v1/jugadores/${jugadorCreatedId}`, {
      headers: { 'x-csrf-token': csrfToken },
      data: {
        nickname,
        nombre_real: 'Juan Test Actualizado',
        pais: 'México',
        rol: 'Support',
        estado: 'activo'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.rol).toBe('Support');
  });

  test('DELETE /api/v1/jugadores/:id — Admin elimina un jugador', async ({ request }) => {
    test.skip(!jugadorCreatedId, 'Requiere jugador creado en test anterior');

    const response = await request.delete(`${API}/api/v1/jugadores/${jugadorCreatedId}`, {
      headers: { 'x-csrf-token': csrfToken }
    });
    expect(response.status()).toBe(204);

    // Verificar que ya no existe
    const checkRes = await request.get(`${API}/api/v1/jugadores/${jugadorCreatedId}`);
    expect(checkRes.status()).toBe(404);
  });

  test('POST /api/v1/jugadores — sin auth retorna 401', async ({ request }) => {
    // Nuevo contexto sin cookies (simulado con un API request nuevo)
    const response = await request.post(`${API}/api/v1/jugadores`, {
      headers: { 'x-csrf-token': 'fake-csrf' },
      data: { nickname: 'SinAuth', rol: 'Mid' }
    });
    // Dependiendo del orden de middlewares: 401 (sin JWT) o 403 (sin CSRF válido)
    expect([401, 403]).toContain(response.status());
  });
});
