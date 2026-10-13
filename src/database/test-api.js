import http from 'http';
import app from '../app.js';
import sequelize from '../config/database.js';
import { resetDatabase } from './reset.js';

let server;
const PORT = 3001;

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
          resolve({ status: res.statusCode, data: json, duration });
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
    // 1. Auxiliares
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

    // 2. Jugadores
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

    await test('RF-01: POST /api/v1/jugadores crea nuevo jugador (201)', async () => {
      const res = await request('POST', '/api/v1/jugadores', {
        nickname: 'ShowMaker',
        nombre_real: 'Heo Su',
        pais: 'Corea del Sur',
        rol: 'Mid',
        estado: 'activo'
      });
      if (res.status !== 201 || res.data.nickname !== 'ShowMaker') {
        throw new Error(`Status ${res.status}, no creó jugador`);
      }
    });

    await test('RN-01: POST /api/v1/jugadores rechaza nickname duplicado con 409 Conflict', async () => {
      const res = await request('POST', '/api/v1/jugadores', {
        nickname: 'Faker',
        rol: 'Mid'
      });
      if (res.status !== 409) {
        throw new Error(`Esperaba 409, obtuve ${res.status}`);
      }
    });

    await test('Valida rol inválido con 400 Bad Request', async () => {
      const res = await request('POST', '/api/v1/jugadores', {
        nickname: 'InvalidGuy',
        rol: 'Invalido'
      });
      if (res.status !== 400) {
        throw new Error(`Esperaba 400, obtuve ${res.status}`);
      }
    });

    await test('RF-04: PUT /api/v1/jugadores/1 actualiza datos (200)', async () => {
      const res = await request('PUT', '/api/v1/jugadores/1', {
        nombre_real: 'Lee Sang-hyeok GOAT'
      });
      if (res.status !== 200 || res.data.nombre_real !== 'Lee Sang-hyeok GOAT') {
        throw new Error(`Status ${res.status}, no actualizó`);
      }
    });

    await test('RF-05: DELETE /api/v1/jugadores/8 elimina jugador (204)', async () => {
      const res = await request('DELETE', '/api/v1/jugadores/8');
      if (res.status !== 204) {
        throw new Error(`Esperaba 204, obtuve ${res.status}`);
      }
    });

    // 3. Rosters
    await test('RF-08: GET /api/v1/rosters lista rosters con cantidad_jugadores', async () => {
      const res = await request('GET', '/api/v1/rosters');
      if (res.status !== 200 || !res.data[0] || res.data[0].cantidad_jugadores === undefined) {
        throw new Error(`Respuesta inválida: ${JSON.stringify(res.data)}`);
      }
    });

    await test('RF-09: GET /api/v1/rosters/1 muestra detalle con lista de jugadores', async () => {
      const res = await request('GET', '/api/v1/rosters/1');
      if (res.status !== 200 || !res.data.jugadores || res.data.jugadores.length !== 5) {
        throw new Error(`Detalle de roster inválido: ${JSON.stringify(res.data)}`);
      }
    });

    await test('RF-07: POST /api/v1/rosters crea nuevo roster (201)', async () => {
      const res = await request('POST', '/api/v1/rosters', {
        nombre: 'KT Rolster Principal',
        juego: 'League of Legends',
        tipo: 'Principal',
        temporada: '2026'
      });
      if (res.status !== 201 || res.data.nombre !== 'KT Rolster Principal') {
        throw new Error(`Status ${res.status}, no creó roster`);
      }
    });

    await test('RF-10: PUT /api/v1/rosters/1 actualiza roster (200)', async () => {
      const res = await request('PUT', '/api/v1/rosters/1', {
        nombre: 'T1 World Champion Roster'
      });
      if (res.status !== 200 || res.data.nombre !== 'T1 World Champion Roster') {
        throw new Error(`Status ${res.status}`);
      }
    });

    // 4. Asignaciones & Reglas de Negocio
    await test('RN-02: POST /api/v1/rosters/1/jugadores rechaza 6.º titular con 409 Conflict', async () => {
      // T1 ya tiene 5 titulares (Faker, Zeus, Oner, Gumayusi, Keria). Intentamos agregar a ShowMaker como Titular:
      const res = await request('POST', '/api/v1/rosters/1/jugadores', {
        id_jugador: 9, // ShowMaker
        rol_en_roster: 'Titular'
      });
      if (res.status !== 409) {
        throw new Error(`Esperaba 409 por límite de titulares, obtuve ${res.status}`);
      }
    });

    await test('RF-12: POST /api/v1/rosters/1/jugadores permite agregar Suplente (201)', async () => {
      const res = await request('POST', '/api/v1/rosters/1/jugadores', {
        id_jugador: 9, // ShowMaker
        rol_en_roster: 'Suplente'
      });
      if (res.status !== 201) {
        throw new Error(`Esperaba 201 para suplente, obtuve ${res.status}`);
      }
    });

    await test('RN-03: POST /api/v1/rosters/2/jugadores rechaza 2 titulares con mismo rol (409)', async () => {
      // G2 tiene a Caps (Mid). Intentamos agregar a Faker (Mid) como Titular en G2:
      const res = await request('POST', '/api/v1/rosters/2/jugadores', {
        id_jugador: 1, // Faker (Mid)
        rol_en_roster: 'Titular'
      });
      if (res.status !== 409) {
        throw new Error(`Esperaba 409 por roles duplicados, obtuve ${res.status}`);
      }
    });

    await test('RN-04: Un jugador puede estar en varios rosters', async () => {
      // Faker está en T1. Ahora lo agregamos como Suplente en G2:
      const res = await request('POST', '/api/v1/rosters/2/jugadores', {
        id_jugador: 1, // Faker
        rol_en_roster: 'Suplente'
      });
      if (res.status !== 201) {
        throw new Error(`Esperaba 201 al agregar jugador a múltiples rosters, obtuve ${res.status}`);
      }
    });

    await test('PUT /api/v1/rosters/2/jugadores/1 cambia rol en roster (200)', async () => {
      const res = await request('PUT', '/api/v1/rosters/2/jugadores/1', {
        rol_en_roster: 'Suplente'
      });
      if (res.status !== 200) {
        throw new Error(`Status ${res.status}`);
      }
    });

    await test('RF-13: DELETE /api/v1/rosters/2/jugadores/1 remueve jugador de roster (204)', async () => {
      const res = await request('DELETE', '/api/v1/rosters/2/jugadores/1');
      if (res.status !== 204) {
        throw new Error(`Esperaba 204, obtuve ${res.status}`);
      }
    });

    await test('RF-11 / RN-05: DELETE /api/v1/rosters/3 elimina roster y preserva jugadores (204)', async () => {
      const res = await request('DELETE', '/api/v1/rosters/3');
      if (res.status !== 204) {
        throw new Error(`Esperaba 204, obtuve ${res.status}`);
      }
      // Verificar que los jugadores siguen existiendo
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
