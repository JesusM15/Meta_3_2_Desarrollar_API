/**
 * tests/rosters.spec.js
 * Suite de pruebas: Rosters + Asignación de jugadores
 */
import { test, expect } from '@playwright/test';
import { API } from './helpers/api-client.js';

const TS = Date.now();

// ── ACCESO PÚBLICO ──────────────────────────────────────────────────────────

test.describe('Rosters: Acceso Público', () => {
  test('GET /api/v1/rosters — retorna lista de rosters sin autenticación', async ({ request }) => {
    const response = await request.get(`${API}/api/v1/rosters`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/v1/rosters/:id — obtiene un roster por ID', async ({ request }) => {
    const listRes = await request.get(`${API}/api/v1/rosters`);
    const list = await listRes.json();
    if (list.length > 0) {
      const id = list[0].id;
      const response = await request.get(`${API}/api/v1/rosters/${id}`);
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(id);
      expect(data).toHaveProperty('nombre');
    }
  });

  test('GET /api/v1/rosters/:id/jugadores — obtiene jugadores de un roster', async ({ request }) => {
    const listRes = await request.get(`${API}/api/v1/rosters`);
    const list = await listRes.json();
    if (list.length > 0) {
      const id = list[0].id;
      const response = await request.get(`${API}/api/v1/rosters/${id}/jugadores`);
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    }
  });

  test('GET /api/v1/rosters/9999 — ID inexistente retorna 404', async ({ request }) => {
    const response = await request.get(`${API}/api/v1/rosters/9999`);
    expect(response.status()).toBe(404);
  });
});

// ── CRUD ADMIN ──────────────────────────────────────────────────────────────

test.describe('Rosters: CRUD Admin', () => {
  let csrfToken = '';
  let rosterCreatedId = null;
  let jugadorId = null;
  const rosterNombre = `Roster_Test_${TS}`;

  test.beforeEach(async ({ request }, testInfo) => {
    if (testInfo.title.includes('sin autenticación')) return;
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@esports.com', password: 'admin123' }
    });
    csrfToken = (await loginRes.json()).csrfToken;
    if (!jugadorId) {
      const created = await request.post(`${API}/api/v1/jugadores`, {
        headers: { 'x-csrf-token': csrfToken },
        data: { nickname: `RosterPlayer_${TS}`, rol: 'Mid' }
      });
      expect(created.status()).toBe(201);
      jugadorId = (await created.json()).id;
    }
  });

  test.afterAll(async ({ request }) => {
    if (!jugadorId) return;
    const login = await request.post(`${API}/auth/login`, { data: { email: 'admin@esports.com', password: 'admin123' } });
    const { csrfToken: token } = await login.json();
    await request.delete(`${API}/api/v1/jugadores/${jugadorId}`, { headers: { 'x-csrf-token': token } });
  });

  test('POST /api/v1/rosters — Admin crea un roster nuevo', async ({ request }) => {
    const response = await request.post(`${API}/api/v1/rosters`, {
      headers: { 'x-csrf-token': csrfToken },
      data: {
        nombre: rosterNombre,
        tipo: 'Principal',
        temporada: '2026'
      }
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.nombre).toBe(rosterNombre);
    rosterCreatedId = data.id;
  });

  test('PUT /api/v1/rosters/:id — Admin edita un roster', async ({ request }) => {
    test.skip(!rosterCreatedId, 'Requiere roster creado en test anterior');

    const response = await request.put(`${API}/api/v1/rosters/${rosterCreatedId}`, {
      headers: { 'x-csrf-token': csrfToken },
      data: {
        nombre: `${rosterNombre}_Editado`,
        tipo: 'Academy',
        temporada: '2027'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.tipo).toBe('Academy');
  });

  test('POST /api/v1/rosters/:id/jugadores — Admin asigna un jugador al roster', async ({ request }) => {
    test.skip(!rosterCreatedId || !jugadorId, 'Requiere roster y jugador existentes');

    const response = await request.post(`${API}/api/v1/rosters/${rosterCreatedId}/jugadores`, {
      headers: { 'x-csrf-token': csrfToken },
      data: {
        id_jugador: jugadorId,
        rol_en_roster: 'Titular'
      }
    });

    expect([200, 201]).toContain(response.status());
  });

  test('PUT /api/v1/rosters/:id/jugadores/:id_jugador — Admin cambia rol en roster', async ({ request }) => {
    test.skip(!rosterCreatedId || !jugadorId, 'Requiere roster y jugador existentes');

    const response = await request.put(`${API}/api/v1/rosters/${rosterCreatedId}/jugadores/${jugadorId}`, {
      headers: { 'x-csrf-token': csrfToken },
      data: { rol_en_roster: 'Suplente' }
    });

    expect([200, 201]).toContain(response.status());
  });

  test('DELETE /api/v1/rosters/:id/jugadores/:id_jugador — Admin quita jugador del roster', async ({ request }) => {
    test.skip(!rosterCreatedId || !jugadorId, 'Requiere roster y jugador existentes');

    const response = await request.delete(`${API}/api/v1/rosters/${rosterCreatedId}/jugadores/${jugadorId}`, {
      headers: { 'x-csrf-token': csrfToken }
    });

    expect([200, 204]).toContain(response.status());
  });

  test('DELETE /api/v1/rosters/:id — Admin elimina un roster', async ({ request }) => {
    test.skip(!rosterCreatedId, 'Requiere roster creado en test anterior');

    const response = await request.delete(`${API}/api/v1/rosters/${rosterCreatedId}`, {
      headers: { 'x-csrf-token': csrfToken }
    });
    expect(response.status()).toBe(204);

    const checkRes = await request.get(`${API}/api/v1/rosters/${rosterCreatedId}`);
    expect(checkRes.status()).toBe(404);
  });

  test('POST /api/v1/rosters — sin autenticación retorna 401', async ({ request }) => {
    // Intentar crear roster sin sesión
    const response = await request.post(`${API}/api/v1/rosters`, {
      headers: { 'x-csrf-token': 'fake' },
      data: { nombre: 'NoAuth', tipo: 'Principal', temporada: '2026' }
    });
    expect([401, 403]).toContain(response.status());
  });
});
