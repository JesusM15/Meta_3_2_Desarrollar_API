<template>
  <div class="login-screen">
    <div class="login-card">
      <div class="login-logo">⚡</div>
      <h2 class="login-title">eSports Roster Ops</h2>
      <p class="login-desc">Portal de Administración y Gestión de Equipos de League of Legends</p>

      <div class="quick-demo-box">
        <div>
          <strong>Credenciales Demo:</strong>
          <div>admin@esports.com / admin123</div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" @click="loadDemoCredentials">
          Cargar Demo
        </button>
      </div>

      <div v-if="errorMessage" class="alert alert-danger">
        <span>⚠️</span> {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">API Key del Sistema</label>
          <input 
            v-model="form.apiKey" 
            type="text" 
            class="input-control" 
            placeholder="esports_api_key_admin_2026" 
            required 
          />
        </div>

        <div class="form-group">
          <label class="form-label">Correo Electrónico</label>
          <input 
            v-model="form.email" 
            type="email" 
            class="input-control" 
            placeholder="admin@esports.com" 
            required 
          />
        </div>

        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input 
            v-model="form.password" 
            type="password" 
            class="input-control" 
            placeholder="••••••••" 
            required 
          />
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;" :disabled="loading">
          <span v-if="loading">⏳ Iniciando sesión...</span>
          <span v-else>🛡️ Iniciar Sesión</span>
        </button>
      </form>

      <div style="margin-top: 1.5rem; font-size: 0.78rem; color: var(--text-dim); text-align: center; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
        🔒 Conexión cifrada y sesión protegida contra ataques de falsificación y robo de credenciales.
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';

const emit = defineEmits(['login-success']);

const form = reactive({
  apiKey: 'esports_api_key_admin_2026',
  email: 'admin@esports.com',
  password: 'admin123'
});

const loading = ref(false);
const errorMessage = ref('');

const loadDemoCredentials = () => {
  form.apiKey = 'esports_api_key_admin_2026';
  form.email = 'admin@esports.com';
  form.password = 'admin123';
  errorMessage.value = '';
};

const handleSubmit = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    emit('login-submit', {
      apiKey: form.apiKey.trim(),
      email: form.email.trim(),
      password: form.password
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
