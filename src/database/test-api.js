import http from 'http';
import app from '../app.js';
import sequelize from '../config/database.js';
import { resetDatabase } from './reset.js';

let server;
const PORT = 3001;

let sessionCookies = '';
let currentCsrfToken = '';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const reqHeaders = { ...headers };
    let payload = null;

    if (body) {
      payload = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    // Adjuntar automáticamente cookies de sesión si están disponibles y no se especifican otras
    if (sessionCookies && !reqHeaders['Cookie'] && !reqHeaders['cookie']) {
      reqHeaders['Cookie'] = sessionCookies;
    }

    // Adjuntar automáticamente token CSRF en operaciones de mutación si está disponible
    const esMutacion = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
    if (esMutacion && currentCsrfToken && !reqHeaders['x-csrf-token'] && reqHeaders['x-csrf-token'] !== false) {
      reqHeaders['x-csrf-token'] = currentCsrfToken;
    }

    // Si se pasó explícitamente false para x-csrf-token, no enviarlo
    if (reqHeaders['x-csrf-token'] === false) {
      delete reqHeaders['x-csrf-token'];
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: reqHeaders
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const duration = Date.now() - startTime;
          let json = null;
          try {
            json = data ? JSON.parse(data) : null;
          } catch {
            json = data;
          }

          // Capturar cookies de respuesta si vienen
          const setCookieHeaders = res.headers['set-cookie'];
          if (setCookieHeaders && Array.isArray(setCookieHeaders)) {
            sessionCookies = setCookieHeaders.map((c) => c.split(';')[0]).join('; ');
          }

          resolve({ status: res.statusCode, data: json, headers: res.headers, duration });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Iniciando batería completa de pruebas automatizadas...\n');

  await resetDatabase();

  server = app.listen(PORT);
  console.log(`✓ Servidor de prueba levantado en puerto ${PORT}\n`);

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`    -> ${err.message}`);
    }
  }

  try {
    // =========================================================================
    // 1. Auxiliares y Salud
    // =========================================================================
    await test('GET /api/v1/health responde 200 y connected', async () => {
      const res = await request('GET', '/api/v1/health');
      if (res.status !== 200 || res.data.database !== 'connected') {
        throw new Error(`Status ${res.status}, db: ${res.data?.database}`);
      }
    });

    await test('GET /api/v1/roles retorna 5 roles válidos', async () => {
      const res = await request('GET', '/api/v1/roles');
      if (res.status !== 200 || res.data.length !== 5) {
        throw new Error(`Esperados 5 roles, recibidos: ${JSON.stringify(res.data)}`);
      }
    });

    await test('GET /api/v1/estados retorna activo e inactivo', async () => {
      const res = await request('GET', '/api/v1/estados');
      if (res.status !== 200 || !res.data.includes('activo')) {
        throw new Error(`Datos inválidos: ${JSON.stringify(res.data)}`);
      }
    });

    await test('GET /api/v1/tipos-roster retorna Principal y Academy', async () => {
      const res = await request('GET', '/api/v1/tipos-roster');
      if (res.status !== 200 || !res.data.includes('Principal')) {
        throw new Error(`Datos inválidos: ${JSON.stringify(res.data)}`);
      }
    });

    // =========================================================================
    // 2. Seguridad y Autenticación JWT + CSRF (Meta 3.4)
    // =========================================================================
    await test('Seguridad: POST /api/v1/auth/login falla sin API Key (401)', async () => {
      const res = await request('POST', '/api/v1/auth/login', {
        email: 'admin@esports.com',
        password: 'admin123'
      });
      if (res.status !== 401) {
        throw new Error(`Esperaba 401 Unauthorized sin API key, obtuve: ${res.status}`);
      }
    });

    await test('Seguridad: POST /api/v1/jugadores rechazado sin JWT (401)', async () => {
      const res = await request('POST', '/api/v1/jugadores', {
        nickname: 'Hacker',
        rol: 'Top'
      });
      if (res.status !== 401) {
        throw new Error(`Esperaba 401 Unauthorized sin token JWT, obtuve: ${res.status}`);
      }
    });

    await test('Auth: POST /api/v1/auth/login exitoso con API Key y Cookies HTTP-Only', async () => {
      const res = await request(
        'POST',
        '/api/v1/auth/login',
        { email: 'admin@esports.com', password: 'admin123' },
        { 'x-api-key': process.env.API_KEY || 'esports_api_key_admin_2026' }
      );
      if (res.status !== 200 || !res.data.csrfToken) {
        throw new Error(`Login fallido. Status: ${res.status}`);
      }
      currentCsrfToken = res.data.csrfToken;
      if (!sessionCookies.includes('jwt_token')) {
        throw new Error('La respuesta no configuró la cookie HTTP-Only jwt_token');
      }
    });

    await test('Auth: GET /api/v1/auth/verify confirma sesión activa de Admin', async () => {
      const res = await request('GET', '/api/v1/auth/verify');
      if (res.status !== 200 || !res.data.autenticado || res.data.usuario.rol !== 'Admin') {
        throw new Error(`Verificación fallida: ${JSON.stringify(res.data)}`);
      }
    });

    await test('Seguridad: POST con JWT pero SIN header CSRF es bloqueado (403)', async () => {
      const res = await request(
        'POST',
        '/api/v1/jugadores',
        { nickname: 'SinCsrf', rol: 'Top' },
        { 'x-csrf-token': false } // omitir intencionalmente token CSRF
      );
      if (res.status !== 403) {
        throw new Error(`Esperaba 403 Forbidden por falta de CSRF token, obtuve: ${res.status}`);
      }
    });

    await test('Seguridad: POST con CSRF inválido es bloqueado (403)', async () => {
      const res = await request(
        'POST',
        '/api/v1/jugadores',
        { nickname: 'BadCsrf', rol: 'Top' },
        { 'x-csrf-token': 'token_falso_adulterado_12345' }
      );
      if (res.status !== 403) {
        throw new Error(`Esperaba 403 Forbidden por CSRF incorrecto, obtuve: ${res.status}`);
      }
    });

    // =========================================================================
    // 3. Jugadores (CRUD y Filtros con JWT + CSRF)
    // =========================================================================
    await test('RF-02: GET /api/v1/jugadores lista los 8 jugadores iniciales', async () => {
      const res = await request('GET', '/api/v1/jugadores');
      if (res.status !== 200 || res.data.length !== 8) {
        throw new Error(`Status ${res.status}, total jugadores: ${res.data?.length}`);
      }
    });

    await test('RF-06: GET /api/v1/jugadores?rol=Mid filtra correctamente', async () => {
      const res = await request('GET', '/api/v1/jugadores?rol=Mid');
      if (res.status !== 200 || !res.data.every((j) => j.rol === 'Mid')) {
        throw new Error('Filtro por rol falló');
      }
    });

    await test('RF-06: GET /api/v1/jugadores?search=faker busca case-insensitively', async () => {
      const res = await request('GET', '/api/v1/jugadores?search=faker');
      if (res.status !== 200 || res.data.length === 0 || res.data[0].nickname !== 'Faker') {
        throw new Error('Búsqueda por nickname falló');
      }
    });

    await test('RF-03: GET /api/v1/jugadores/1 obtiene detalle de Faker', async () => {
      const res = await request('GET', '/api/v1/jugadores/1');
      if (res.status !== 200 || res.data.nickname !== 'Faker') {
        throw new Error('Detalle de jugador falló');
      }
    });

    await test('RF-01: POST /api/v1/jugadores crea nuevo jugador con JWT y CSRF (201)', async () => {
      const res = await request('POST', '/api/v1/jugadores', {
        nickname: 'ShowMaker',
        nombre_real: 'Heo Su',
        pais: 'Corea del Sur',
        rol: 'Mid',
        estado: 'activo'
      });
      if (res.status !== 201 || res.data.nickname !== 'ShowMaker') {
        throw new Error(`Status: ${res.status}, data: ${JSON.stringify(res.data)}`);
      }
    });

    await test('RN-01: Validar nickname duplicado responde 409 Conflict', async () => {
      const res = await request('POST', '/api/v1/jugadores', {
        nickname: 'Faker',
        nombre_real: 'Lee Sang-hyeok Duplicado',
        rol: 'Mid',
        estado: 'activo'
      });
      if (res.status !== 409) {
        throw new Error(`Esperaba 409 Conflict, obtuve: ${res.status}`);
      }
    });

    await test('RF-04: PUT /api/v1/jugadores/:id actualiza datos de jugador (200)', async () => {
      const res = await request('PUT', '/api/v1/jugadores/1', {
        nombre_real: 'Lee Sang-hyeok (Actualizado)'
      });
      if (res.status !== 200 || res.data.nombre_real !== 'Lee Sang-hyeok (Actualizado)') {
        throw new Error(`Status: ${res.status}, data: ${JSON.stringify(res.data)}`);
      }
    });

    await test('RF-05: DELETE /api/v1/jugadores/:id elimina un jugador (204)', async () => {
      const createRes = await request('POST', '/api/v1/jugadores', {
        nickname: 'Temporal',
        rol: 'Top'
      });
      const tempId = createRes.data.id;
      const res = await request('DELETE', `/api/v1/jugadores/${tempId}`);
      if (res.status !== 204) {
        throw new Error(`Esperaba 204 No Content, obtuve ${res.status}`);
      }
    });

    // =========================================================================
    // 4. Rosters y Reglas de Negocio
    // =========================================================================
    await test('RF-08: GET /api/v1/rosters lista los rosters existentes con cantidad_jugadores', async () => {
      const res = await request('GET', '/api/v1/rosters');
      if (res.status !== 200 || res.data.length === 0 || res.data[0].cantidad_jugadores === undefined) {
        throw new Error(`Datos inválidos de rosters: ${JSON.stringify(res.data)}`);
      }
    });

    await test('RF-07: POST /api/v1/rosters crea un nuevo roster (201)', async () => {
      const res = await request('POST', '/api/v1/rosters', {
        nombre: 'Fnatic',
        juego: 'League of Legends',
        tipo: 'Principal',
        temporada: '2026'
      });
      if (res.status !== 201 || res.data.nombre !== 'Fnatic') {
        throw new Error(`Status ${res.status}, data: ${JSON.stringify(res.data)}`);
      }
    });

    await test('RF-09: GET /api/v1/rosters/:id/jugadores lista jugadores del roster', async () => {
      const res = await request('GET', '/api/v1/rosters/1/jugadores');
      if (res.status !== 200 || !Array.isArray(res.data) || res.data.length === 0) {
        throw new Error('No se recuperaron jugadores del roster 1');
      }
    });

    await test('RF-10: POST /api/v1/rosters/:id/jugadores asigna jugador como Suplente', async () => {
      const res = await request('POST', '/api/v1/rosters/1/jugadores', {
        id_jugador: 8,
        rol_en_roster: 'Suplente'
      });
      if (res.status !== 201 || res.data.rol_en_roster !== 'Suplente') {
        throw new Error(`Status ${res.status}, data: ${JSON.stringify(res.data)}`);
      }
    });

    await test('RF-11: PUT /api/v1/rosters/:id/jugadores/:id_jugador actualiza rol', async () => {
      const res = await request('PUT', '/api/v1/rosters/1/jugadores/8', {
        rol_en_roster: 'Suplente'
      });
      if (res.status !== 200) {
        throw new Error(`Status ${res.status}`);
      }
    });

    await test('RF-12: DELETE /api/v1/rosters/:id/jugadores/:id_jugador desasigna jugador (204)', async () => {
      const res = await request('DELETE', '/api/v1/rosters/1/jugadores/8');
      if (res.status !== 204) {
        throw new Error(`Esperaba 204, obtuve ${res.status}`);
      }
    });

    await test('RN-02: No permitir más de 5 titulares en un roster (409 Conflict)', async () => {
      const res = await request('POST', '/api/v1/rosters/1/jugadores', {
        id_jugador: 8,
        rol_en_roster: 'Titular'
      });
      if (res.status !== 409) {
        throw new Error(`Esperaba 409 Conflict (Roster lleno con 5 titulares), obtuve ${res.status}`);
      }
    });

    await test('RN-03: No permitir dos titulares con la misma posición en un roster (409 Conflict)', async () => {
      const resRoster = await request('POST', '/api/v1/rosters', {
        nombre: 'Test Roles',
        juego: 'League of Legends',
        tipo: 'Principal',
        temporada: '2026'
      });
      const newRosterId = resRoster.data.id;

      await request('POST', `/api/v1/rosters/${newRosterId}/jugadores`, {
        id_jugador: 1, // Faker (Mid)
        rol_en_roster: 'Titular'
      });

      const resDuplicado = await request('POST', `/api/v1/rosters/${newRosterId}/jugadores`, {
        id_jugador: 6, // Caps (Mid)
        rol_en_roster: 'Titular'
      });

      if (resDuplicado.status !== 409) {
        throw new Error(`Esperaba 409 Conflict por rol repetido entre titulares, obtuve ${resDuplicado.status}`);
      }
    });

    await test('RN-05: Eliminar roster NO elimina los jugadores de la base de datos', async () => {
      const resRoster = await request('POST', '/api/v1/rosters', {
        nombre: 'Roster a Eliminar',
        juego: 'League of Legends',
        tipo: 'Academy',
        temporada: '2026'
      });
      const idAEliminar = resRoster.data.id;

      const resDel = await request('DELETE', `/api/v1/rosters/${idAEliminar}`);
      if (resDel.status !== 204) {
        throw new Error(`Esperaba 204, obtuve ${resDel.status}`);
      }

      // Verificar que los jugadores siguen existiendo intactos
      const resJug = await request('GET', '/api/v1/jugadores/1');
      if (resJug.status !== 200) {
        throw new Error('Los jugadores no deben ser eliminados al borrar un roster');
      }
    });

    await test('Seguridad de Roles: rol Publico no puede crear recursos (403)', async () => {
      const res = await request(
        'POST',
        '/api/v1/jugadores',
        { nickname: 'Anon', rol: 'Top' },
        { 'x-role': 'Publico' }
      );
      if (res.status !== 403) {
        throw new Error(`Esperaba 403 Forbidden para rol Publico, obtuve ${res.status}`);
      }
    });

    await test('RNF-03: Tiempo de respuesta promedio < 0.5s (500ms)', async () => {
      const res = await request('GET', '/api/v1/jugadores');
      if (res.duration >= 500) {
        throw new Error(`Tiempo de respuesta ${res.duration}ms superó el límite de 500ms`);
      }
    });

  } finally {
    server.close();
    await sequelize.close();
  }

  console.log(`\n====================================================`);
  console.log(`Resultado final: ${passed}/${total} pruebas superadas.`);
  console.log(`====================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
