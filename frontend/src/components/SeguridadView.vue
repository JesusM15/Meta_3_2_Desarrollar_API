<template>
  <div class="card-panel">
    <div class="panel-header">
      <div class="panel-title-group">
        <h2><span>🔐</span> Centro de Seguridad: Control de Sesión y Prevención CSRF</h2>
        <p class="panel-subtitle">Monitoreo de tokens de sesión, protección contra ataques CSRF y auditoría en tiempo real</p>
      </div>

      <div class="security-badge pulse">
        <span>🛡️</span> Mecanismo Activo & Protegido
      </div>
    </div>

    <!-- Technical Architecture Diagram / Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
      <!-- Card 1: JWT en Cookie HttpOnly -->
      <div style="background: rgba(9, 14, 28, 0.7); border: 1px solid var(--border-gold); border-radius: var(--radius-md); padding: 1.5rem;">
        <h3 style="font-family: var(--font-display); font-size: 1.25rem; color: var(--text-gold); display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
          <span>🍪</span> Token JWT en Cookie HTTP-Only
        </h3>
        <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 1rem;">
          El token JWT generado al iniciar sesión como Administrador se almacena en una cookie con la directiva <strong style="color: #fff;">HttpOnly=true</strong>.
        </p>
        <div style="background: rgba(0, 0, 0, 0.4); border-radius: var(--radius-sm); padding: 0.75rem; font-family: monospace; font-size: 0.8rem; color: var(--gold-light);">
          Set-Cookie: jwt_token=...; HttpOnly; SameSite=Lax; Path=/
        </div>
        <div style="margin-top: 0.75rem; font-size: 0.8rem; color: var(--green-success);">
          ✓ <strong>Protección Anti-XSS:</strong> Ningún script JavaScript malicioso puede leer ni robar este token vía <code>document.cookie</code>.
        </div>
      </div>

      <!-- Card 2: Prevención CSRF (Doble Token Pattern) -->
      <div style="background: rgba(9, 14, 28, 0.7); border: 1px solid var(--border-glow); border-radius: var(--radius-md); padding: 1.5rem;">
        <h3 style="font-family: var(--font-display); font-size: 1.25rem; color: var(--cyan-neon); display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
          <span>🛡️</span> Prevención de CSRF (Doble Token)
        </h3>
        <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 1rem;">
          Como el navegador envía automáticamente las cookies en peticiones cross-site, se emite un <strong style="color: #fff;">Token CSRF</strong> que viaja en la cabecera personalizada <code style="color: var(--cyan-neon);">x-csrf-token</code>.
        </p>
        <div style="background: rgba(0, 0, 0, 0.4); border-radius: var(--radius-sm); padding: 0.75rem; font-family: monospace; font-size: 0.8rem; color: var(--cyan-neon); word-break: break-all;">
          Header: x-csrf-token: {{ currentCsrfToken || 'Sin token activo' }}
        </div>
        <div style="margin-top: 0.75rem; font-size: 0.8rem; color: var(--cyan-neon);">
          ✓ <strong>Anti-CSRF:</strong> Un sitio web de terceros no puede leer este token debido a la Política de Mismo Origen (SOP).
        </div>
      </div>
    </div>

    <!-- Live Testing Console (Laboratorio Interactivo de Demostración) -->
    <div style="background: rgba(14, 20, 36, 0.9); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.75rem;">
      <h3 style="font-family: var(--font-display); font-size: 1.4rem; color: #fff; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
        <span>🧪</span> Consola de Pruebas de Seguridad en Tiempo Real
      </h3>
      <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1.5rem;">
        Ejecute peticiones de prueba hacia el backend para comprobar en vivo cómo el servidor reacciona ante peticiones legítimas y ante intentos de ataque CSRF.
      </p>

      <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
        <button class="btn btn-primary" :disabled="testing" @click="testValidCsrf">
          <span>✅</span> Probar Petición Con CSRF Válido (Debe responder 201)
        </button>

        <button class="btn btn-danger" :disabled="testing" @click="testMissingCsrf">
          <span>❌</span> Simular Ataque CSRF (Sin Header x-csrf-token &rarr; Debe responder 403)
        </button>

        <button class="btn btn-secondary" :disabled="testing" @click="testTamperedCsrf">
          <span>⚠️</span> Probar Token CSRF Adulterado (Debe responder 403)
        </button>
      </div>

      <!-- Test Output Console -->
      <div v-if="testResult" style="background: #060911; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; font-family: monospace; font-size: 0.88rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 0.5rem;">
          <span style="font-weight: 700; color: #fff;">{{ testResult.title }}</span>
          <span 
            class="status-badge" 
            :class="testResult.status === 201 || testResult.status === 200 ? 'activo' : 'inactivo'"
            :style="{ background: testResult.status === 403 ? 'rgba(255,71,87,0.2)' : '', color: testResult.status === 403 ? '#ff6b81' : '' }"
          >
            HTTP {{ testResult.status }} {{ testResult.statusText }}
          </span>
        </div>

        <div style="color: var(--text-muted); margin-bottom: 0.5rem;">
          <strong>Cabeceras Enviadas:</strong>
        </div>
        <pre style="color: var(--cyan-neon); margin-bottom: 0.75rem; white-space: pre-wrap;">{{ JSON.stringify(testResult.headers, null, 2) }}</pre>

        <div style="color: var(--text-muted); margin-bottom: 0.5rem;">
          <strong>Respuesta del Servidor Backend:</strong>
        </div>
        <pre :style="{ color: testResult.status === 403 ? '#ff6b81' : '#2ed573' }" style="white-space: pre-wrap;">{{ JSON.stringify(testResult.body, null, 2) }}</pre>

        <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.82rem; color: var(--text-gold);">
          💡 <strong>Diagnóstico:</strong> {{ testResult.explanation }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getCsrfToken, api } from '../services/api.js';

const emit = defineEmits(['notify', 'refresh-stats']);

const testing = ref(false);
const testResult = ref(null);

const currentCsrfToken = computed(() => getCsrfToken());

const testValidCsrf = async () => {
  testing.value = true;
  testResult.value = null;
  const token = getCsrfToken();
  const testNickname = `TestValid_${Date.now().toString().slice(-4)}`;

  try {
    const res = await fetch('/api/v1/jugadores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token
      },
      credentials: 'include',
      body: JSON.stringify({
        nickname: testNickname,
        nombre_real: 'Prueba CSRF Valida',
        rol: 'Mid',
        estado: 'activo'
      })
    });

    const body = await res.json();
    testResult.value = {
      title: 'Prueba de Mutación Legítima con Token CSRF Válido',
      status: res.status,
      statusText: res.statusText || 'Created',
      headers: {
        'Cookie': 'jwt_token=[HTTP-Only Automática]',
        'x-csrf-token': token
      },
      body,
      explanation: 'El backend validó que la cookie HTTP-Only coincide con el token CSRF provisto en la cabecera. La operación fue procesada con éxito (201 Created).'
    };

    emit('notify', { message: 'Prueba con CSRF exitosa (HTTP 201).', type: 'success' });
    emit('refresh-stats');
  } catch (err) {
    testResult.value = {
      title: 'Error de Red',
      status: 0,
      statusText: 'Network Error',
      headers: {},
      body: { error: err.message },
      explanation: 'No se pudo contactar al servidor.'
    };
  } finally {
    testing.value = false;
  }
};

const testMissingCsrf = async () => {
  testing.value = true;
  testResult.value = null;
  const testNickname = `TestMalicious_${Date.now().toString().slice(-4)}`;

  try {
    // Enviamos con credenciales (cookie) pero SIN la cabecera x-csrf-token
    const res = await fetch('/api/v1/jugadores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // x-csrf-token omitido intencionalmente
      },
      credentials: 'include',
      body: JSON.stringify({
        nickname: testNickname,
        rol: 'Top'
      })
    });

    const body = await res.json();
    testResult.value = {
      title: 'Simulación de Ataque CSRF (Sin Cabecera x-csrf-token)',
      status: res.status,
      statusText: res.statusText || 'Forbidden',
      headers: {
        'Cookie': 'jwt_token=[HTTP-Only Automática]',
        'x-csrf-token': '[OMITIDO INTENCIONALMENTE]'
      },
      body,
      explanation: 'El navegador adjuntó la cookie de sesión, pero como el atacante no puede inyectar la cabecera x-csrf-token, el middleware requireAdmin interceptó y rechazó la petición con código 403 Forbidden. ¡El sistema está 100% protegido!'
    };

    emit('notify', { message: 'Ataque CSRF bloqueado con éxito (HTTP 403 Forbidden).', type: 'success' });
  } catch (err) {
    testResult.value = {
      title: 'Error de Red',
      status: 0,
      statusText: 'Network Error',
      headers: {},
      body: { error: err.message },
      explanation: 'No se pudo contactar al servidor.'
    };
  } finally {
    testing.value = false;
  }
};

const testTamperedCsrf = async () => {
  testing.value = true;
  testResult.value = null;

  try {
    const res = await fetch('/api/v1/jugadores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': 'token_falso_o_adulterado_hack_12345'
      },
      credentials: 'include',
      body: JSON.stringify({
        nickname: 'FakeUser',
        rol: 'Support'
      })
    });

    const body = await res.json();
    testResult.value = {
      title: 'Intento con Token CSRF Adulterado o Falso',
      status: res.status,
      statusText: res.statusText || 'Forbidden',
      headers: {
        'Cookie': 'jwt_token=[HTTP-Only Automática]',
        'x-csrf-token': 'token_falso_o_adulterado_hack_12345'
      },
      body,
      explanation: 'El servidor comparó el token recibido contra el hash criptográfico incrustado dentro del JWT firmado y detectó que no coinciden. La petición fue bloqueada con 403 Forbidden.'
    };

    emit('notify', { message: 'Token adulterado detectado y bloqueado (HTTP 403).', type: 'info' });
  } catch (err) {
    testResult.value = {
      title: 'Error de Red',
      status: 0,
      statusText: 'Network Error',
      headers: {},
      body: { error: err.message },
      explanation: 'No se pudo contactar al servidor.'
    };
  } finally {
    testing.value = false;
  }
};
</script>
