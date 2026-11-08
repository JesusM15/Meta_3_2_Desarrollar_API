<template>
  <div class="login-screen">
    <div class="login-card">
      <div class="login-logo">⚡</div>
      <h2 class="login-title">eSports Roster Ops</h2>
      <p class="login-desc">Portal de Gestión de Equipos de League of Legends</p>

      <!-- Tabs: Login / Registro -->
      <div class="login-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
        <button
          class="btn btn-sm"
          :class="mode === 'login' ? 'btn-primary' : 'btn-secondary'"
          @click="mode = 'login'; errorMessage = ''"
          style="flex: 1;"
        >
          🔑 Iniciar Sesión
        </button>
        <button
          class="btn btn-sm"
          :class="mode === 'register' ? 'btn-primary' : 'btn-secondary'"
          @click="mode = 'register'; errorMessage = ''"
          style="flex: 1;"
        >
          📝 Registrarse
        </button>
      </div>

      <!-- Demo Credentials Box (solo en modo login) -->
      <div v-if="mode === 'login'" class="quick-demo-box">
        <div>
          <strong>Credenciales Admin:</strong>
          <div>admin@esports.com / admin123</div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" @click="loadDemoCredentials">
          Cargar Demo
        </button>
      </div>

      <div v-if="errorMessage" class="alert alert-danger">
        <span>⚠️</span> {{ errorMessage }}
      </div>

      <!-- Formulario de Login -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">Correo Electrónico</label>
          <input
            v-model="loginForm.email"
            type="email"
            class="input-control"
            placeholder="admin@esports.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input
            v-model="loginForm.password"
            type="password"
            class="input-control"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;" :disabled="loading">
          <span v-if="loading">⏳ Iniciando sesión...</span>
          <span v-else>🛡️ Iniciar Sesión</span>
        </button>
      </form>

      <!-- Formulario de Registro -->
      <form v-else @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input
            v-model="registerForm.nombre"
            type="text"
            class="input-control"
            placeholder="Tu nombre completo"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Correo Electrónico</label>
          <input
            v-model="registerForm.email"
            type="email"
            class="input-control"
            placeholder="tu@email.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Contraseña (mín. 6 caracteres)</label>
          <input
            v-model="registerForm.password"
            type="password"
            class="input-control"
            placeholder="••••••••"
            autocomplete="new-password"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;" :disabled="loading">
          <span v-if="loading">⏳ Registrando...</span>
          <span v-else>📝 Crear Cuenta (Rol: Público)</span>
        </button>
      </form>

      <div style="margin-top: 1.5rem; font-size: 0.78rem; color: var(--text-dim); text-align: center; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
        🔒 Sesión protegida con JWT HTTP-Only + Token CSRF
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';

const emit = defineEmits(['login-submit', 'register-submit']);

const mode = ref('login');
const loading = ref(false);
const errorMessage = ref('');

const loginForm = reactive({
  email: '',
  password: ''
});

const registerForm = reactive({
  nombre: '',
  email: '',
  password: ''
});

const loadDemoCredentials = () => {
  loginForm.email = 'admin@esports.com';
  loginForm.password = 'admin123';
  errorMessage.value = '';
};

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    emit('login-submit', {
      email: loginForm.email.trim(),
      password: loginForm.password
    });
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    emit('register-submit', {
      nombre: registerForm.nombre.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password
    });
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
  }
};

defineExpose({
  setError: (msg) => {
    errorMessage.value = msg;
    loading.value = false;
  },
  setLoading: (val) => {
    loading.value = val;
  }
});
</script>
