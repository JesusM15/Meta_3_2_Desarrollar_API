<template>
  <div class="app-root">
    <!-- Login Screen when not authenticated -->
    <LoginView 
      v-if="!isAuthenticated" 
      ref="loginRef"
      @login-submit="handleLogin" 
    />

    <!-- Admin Portal Dashboard when authenticated -->
    <template v-else>
      <Navbar 
        :current-tab="currentTab" 
        :user="currentUser"
        @change-tab="setTab"
        @logout="handleLogout"
      />

      <main class="main-content">
        <!-- Tab 1: Dashboard -->
        <DashboardView 
          v-if="currentTab === 'dashboard'"
          :stats="stats"
          :health-info="healthInfo"
          @navigate="setTab"
        />

        <!-- Tab 2: Jugadores -->
        <JugadoresView 
          v-else-if="currentTab === 'jugadores'"
          @notify="triggerToast"
          @refresh-stats="loadStats"
        />

        <!-- Tab 3: Rosters & Alineación -->
        <RostersView 
          v-else-if="currentTab === 'rosters'"
          @notify="triggerToast"
          @refresh-stats="loadStats"
        />

        <!-- Tab 4: Seguridad & CSRF -->
        <SeguridadView 
          v-else-if="currentTab === 'seguridad'"
          @notify="triggerToast"
          @refresh-stats="loadStats"
        />
      </main>
    </template>

    <!-- Toast Notifications Container -->
    <div class="toast-container">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="toast"
        :style="{
          borderColor: toast.type === 'danger' ? 'var(--red-danger)' : (toast.type === 'success' ? 'var(--green-success)' : 'var(--cyan-neon)')
        }"
      >
        <span>{{ toast.type === 'danger' ? '⚠️' : (toast.type === 'success' ? '✅' : 'ℹ️') }}</span>
        <span>{{ toast.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { api, setCsrfToken } from './services/api.js';

import Navbar from './components/Navbar.vue';
import LoginView from './components/LoginView.vue';
import DashboardView from './components/DashboardView.vue';
import JugadoresView from './components/JugadoresView.vue';
import RostersView from './components/RostersView.vue';
import SeguridadView from './components/SeguridadView.vue';

const isAuthenticated = ref(false);
const currentUser = ref(null);
const currentTab = ref('dashboard');
const loginRef = ref(null);

const stats = reactive({
  totalJugadores: 0,
  totalRosters: 0,
  titulares: 0,
  suplentes: 0
});

const healthInfo = ref(null);
const toasts = ref([]);

const triggerToast = ({ message, type = 'info' }) => {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, 4000);
};

const setTab = (tabName) => {
  currentTab.value = tabName;
};

const handleLogin = async ({ apiKey, email, password }) => {
  try {
    const data = await api.auth.login(apiKey, email, password);
    isAuthenticated.value = true;
    currentUser.value = data.usuario;
    triggerToast({
      message: `¡Bienvenido ${data.usuario.email}! Sesión iniciada con éxito.`,
      type: 'success'
    });
    loadStats();
  } catch (err) {
    if (loginRef.value?.setError) {
      loginRef.value.setError(err.message || 'Error al iniciar sesión');
    }
    triggerToast({ message: err.message, type: 'danger' });
  }
};

const handleLogout = async () => {
  try {
    await api.auth.logout();
  } catch (err) {
    console.error('Error during logout:', err);
  } finally {
    isAuthenticated.value = false;
    currentUser.value = null;
    currentTab.value = 'dashboard';
    triggerToast({ message: 'Has cerrado sesión correctamente.', type: 'info' });
  }
};

const checkSession = async () => {
  try {
    const data = await api.auth.verify();
    if (data?.autenticado) {
      isAuthenticated.value = true;
      currentUser.value = data.usuario;
      loadStats();
    }
  } catch {
    // Si falla o no hay cookie válida, mostrar pantalla de login
    isAuthenticated.value = false;
    currentUser.value = null;
  }
};

const loadStats = async () => {
  try {
    const [jugadores, rosters, health] = await Promise.allSettled([
      api.jugadores.getAll(),
      api.rosters.getAll(),
      api.auxiliares.getHealth()
    ]);

    if (jugadores.status === 'fulfilled' && Array.isArray(jugadores.value)) {
      stats.totalJugadores = jugadores.value.length;
    }

    if (rosters.status === 'fulfilled' && Array.isArray(rosters.value)) {
      stats.totalRosters = rosters.value.length;

      // Calcular titulares y suplentes sumando las asignaciones de cada roster
      let tCount = 0;
      let sCount = 0;
      const detailPromises = rosters.value.map((r) => api.rosterJugadores.getJugadores(r.id));
      const details = await Promise.allSettled(detailPromises);

      details.forEach((res) => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          res.value.forEach((j) => {
            const rolEnRoster = j.Roster_Jugador?.rol_en_roster || j.rol_en_roster;
            if (rolEnRoster === 'Titular') tCount++;
            else if (rolEnRoster === 'Suplente') sCount++;
          });
        }
      });

      stats.titulares = tCount;
      stats.suplentes = sCount;
    }

    if (health.status === 'fulfilled') {
      healthInfo.value = health.value;
    }
  } catch (err) {
    console.error('Error cargando estadísticas:', err);
  }
};

onMounted(() => {
  checkSession();
});
</script>
