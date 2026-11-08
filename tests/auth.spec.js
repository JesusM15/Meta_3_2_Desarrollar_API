/**
 * tests/auth.spec.js
 * Suite de pruebas: Autenticación (login, registro, logout, verificación de sesión)
 */
import { test, expect } from '@playwright/test';
import { API, loginAdmin, registerUser } from './helpers/api-client.js';

const TEST_EMAIL = `test_${Date.now()}@esports.com`;
const TEST_PASSWORD = 'password123';
const TEST_NOMBRE = 'Usuario Test';

// ── LOGIN ───────────────────────────────────────────────────────────────────

test.describe('Auth: Login', () => {
  test('POST /auth/login — login Admin exitoso retorna 200 + usuario + csrfToken', async ({ request }) => {
    const response = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@esports.com', password: 'admin123' }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('usuario');
    expect(data.usuario.email).toBe('admin@esports.com');
    expect(data.usuario.rol).toBe('Admin');
    expect(data).toHaveProperty('csrfToken');
    expect(data.csrfToken).toBeTruthy();
    // La cookie jwt_token debe estar presente (HTTP-Only)
    const headers = response.headers();
    expect(headers['set-cookie']).toContain('jwt_token');
  });

  test('POST /auth/login — credenciales incorrectas retorna 401', async ({ request }) => {
    const response = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@esports.com', password: 'wrongpassword' }
    });
    expect(response.status()).toBe(401);
  });

  test('POST /auth/login — email incorrecto retorna 401', async ({ request }) => {
    const response = await request.post(`${API}/auth/login`, {
      data: { email: 'noexiste@esports.com', password: 'admin123' }
    });
    expect(response.status()).toBe(401);
  });

  test('POST /auth/login — campos vacíos retorna 400', async ({ request }) => {
    const response = await request.post(`${API}/auth/login`, {
      data: {}
    });
    expect(response.status()).toBe(400);
  });
});

// ── REGISTRO ────────────────────────────────────────────────────────────────

test.describe('Auth: Registro', () => {
  test('POST /auth/register — registro nuevo usuario retorna 201 + rol Public', async ({ request }) => {
    const response = await request.post(`${API}/auth/register`, {
      data: {
        nombre: TEST_NOMBRE,
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.usuario.rol).toBe('Public');
    expect(data.usuario.email).toBe(TEST_EMAIL);
    expect(data).toHaveProperty('csrfToken');
    const headers = response.headers();
    expect(headers['set-cookie']).toContain('jwt_token');
  });

  test('POST /auth/register — email duplicado retorna 409', async ({ request }) => {
    // Intentar registrar el mismo email nuevamente
    const response = await request.post(`${API}/auth/register`, {
      data: {
        nombre: 'Otro Nombre',
        email: 'admin@esports.com', // Ya existe
        password: 'password123'
      }
    });
    expect(response.status()).toBe(409);
  });

  test('POST /auth/register — password corta retorna 400', async ({ request }) => {
    const response = await request.post(`${API}/auth/register`, {
      data: {
        nombre: 'Test',
        email: `short_${Date.now()}@test.com`,
        password: '123'
      }
    });
    expect(response.status()).toBe(400);
  });

  test('POST /auth/register — campos faltantes retorna 400', async ({ request }) => {
    const response = await request.post(`${API}/auth/register`, {
      data: { nombre: 'Test' }
    });
    expect(response.status()).toBe(400);
  });
});

// ── LOGOUT ──────────────────────────────────────────────────────────────────

test.describe('Auth: Logout', () => {
  test('POST /auth/logout — retorna 200 y limpia cookies', async ({ request }) => {
    // Primero loguearse
    await request.post(`${API}/auth/login`, {
      data: { email: 'admin@esports.com', password: 'admin123' }
    });

    const login = await request.get(`${API}/auth/verify`);
    const { csrfToken } = await login.json();
    const response = await request.post(`${API}/auth/logout`, { headers: { 'x-csrf-token': csrfToken } });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.mensaje).toContain('cerrada');
    // La cookie jwt_token debe borrarse (Expires en el pasado o Max-Age=0)
    const headers = response.headers();
    if (headers['set-cookie']) {
      expect(headers['set-cookie']).toMatch(/jwt_token=;|jwt_token=%3B|Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    }
  });
});

// ── VERIFY ──────────────────────────────────────────────────────────────────

test.describe('Auth: Verify', () => {
  test('GET /auth/verify — sin token retorna 401', async ({ request }) => {
    const response = await request.get(`${API}/auth/verify`);
    expect(response.status()).toBe(401);
  });

  test('GET /auth/verify — con sesión activa retorna 200 + datos del usuario', async ({ request }) => {
    // Login para obtener cookie
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@esports.com', password: 'admin123' }
    });
    expect(loginRes.status()).toBe(200);

    // Verify (el contexto de request comparte cookies)
    const verifyRes = await request.get(`${API}/auth/verify`);
    expect(verifyRes.status()).toBe(200);
    const data = await verifyRes.json();
    expect(data.autenticado).toBe(true);
    expect(data.usuario.rol).toBe('Admin');
  });
});
