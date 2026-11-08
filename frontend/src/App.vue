<template>
  <div class="app-root">
    <!-- Vista Pública (no autenticado) -->
    <template v-if="!isAuthenticated">
      <!-- Si se quiere ver el portal público sin login -->
      <template v-if="showPublicPortal">
        <header class="app-header">
          <div class="brand-section">
            <div class="brand-logo-icon">⚡</div>
            <div>
              <h1 class="brand-title">eSports Roster Ops</h1>
              <p class="brand-subtitle">Portal Público</p>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" @click="showPublicPortal = false" data-testid="btn-ir-login">
            🔑 Iniciar Sesión
          </button>
        </header>
        <main class="main-content">
          <PublicView @go-login="showPublicPortal = false" />
        </main>
      </template>

      <!-- Pantalla de Login / Registro -->
      <template v-else>
        <LoginView
          ref="loginRef"
          @login-submit="handleLogin"
          @register-submit="handleRegister"
        />
        <div style="text-align: center; margin-top: 1rem;">
          <button
            class="btn btn-secondary btn-sm"
            @click="showPublicPortal = true"
            data-testid="btn-ver-portal-publico"
          >
            🌐 Ver Portal Público (sin cuenta)
          </button>
        </div>
      </template>
    </template>

    <!-- Portal Autenticado (Admin o Public) -->
    <template v-else>
      <Navbar
        :current-tab="currentTab"
        :user="currentUser"
        @change-tab="setTab"
        @logout="handleLogout"
      />

      <main class="main-content">
        <!-- ── VISTAS ADMIN ──────────────────────────── -->
        <template v-if="currentUser?.rol === 'Admin'">
          <DashboardView
            v-if="currentTab === 'dashboard'"
            :stats="stats"
            :health-info="healthInfo"
            @navigate="setTab"
          />
          <JugadoresView
            v-else-if="currentTab === 'jugadores'"
            @notify="triggerToast"
            @refresh-stats="loadStats"
          />
          <RostersView
            v-else-if="currentTab === 'rosters'"
            @notify="triggerToast"
            @refresh-stats="loadStats"
          />
          <UsuariosView
            v-else-if="currentTab === 'usuarios'"
            @notify="triggerToast"
          />
          <SeguridadView
            v-else-if="currentTab === 'seguridad'"
            @notify="triggerToast"
            @refresh-stats="loadStats"
          />
        </template>

        <!-- ── VISTAS PUBLIC ─────────────────────────── -->
        <template v-else-if="currentUser?.rol === 'Public'">
          <PublicView
            v-if="currentTab === 'public'"
            @go-login="handleLogout"
          />
        </template>
      </main>
    </template>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :style="{
          borderColor: toast.type === 'danger'
            ? 'var(--red-danger)'
            : toast.type === 'success'
              ? 'var(--green-success)'
              : 'var(--cyan-neon)'
        }"
      >
        <span>{{ toast.type === 'danger' ? '⚠️' : toast.type === 'success' ? '✅' : 'ℹ️' }}</span>
        <span>{{ toast.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { api } from './services/api.js';

import Navbar from './components/Navbar.vue';
import LoginView from './components/LoginView.vue';
import PublicView from './components/PublicView.vue';
import DashboardView from './components/DashboardView.vue';
import JugadoresView from './components/JugadoresView.vue';
import RostersView from './components/RostersView.vue';
import UsuariosView from './components/UsuariosView.vue';
import SeguridadView from './components/SeguridadView.vue';

const isAuthenticated = ref(false);
const currentUser = ref(null);
const currentTab = ref('dashboard');
const showPublicPortal = ref(false);
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

const handleLogin = async ({ email, password }) => {
  try {
    const data = await api.auth.login(email, password);
    isAuthenticated.value = true;
    currentUser.value = data.usuario;
    // Iniciar en la tab correcta según rol
    currentTab.value = data.usuario.rol === 'Admin' ? 'dashboard' : 'public';
    triggerToast({
      message: `¡Bienvenido ${data.usuario.nombre}! (${data.usuario.rol})`,
      type: 'success'
    });
    if (data.usuario.rol === 'Admin') loadStats();
  } catch (err) {
    if (loginRef.value?.setError) {
      loginRef.value.setError(err.message || 'Error al iniciar sesión');
    }
    triggerToast({ message: err.message, type: 'danger' });
  }
};

const handleRegister = async ({ nombre, email, password }) => {
  try {
    const data = await api.auth.register(nombre, email, password);
    isAuthenticated.value = true;
    currentUser.value = data.usuario;
    currentTab.value = 'public';
    triggerToast({
      message: `¡Cuenta creada! Bienvenido ${data.usuario.nombre} (Rol: ${data.usuario.rol})`,
      type: 'success'
    });
  } catch (err) {
    if (loginRef.value?.setError) {
      loginRef.value.setError(err.message || 'Error al registrarse');
    }
    triggerToast({ message: err.message, type: 'danger' });
  }
};

const handleLogout = async () => {
  try {
    await api.auth.logout();
  } catch (err) {
    console.error('Error durante logout:', err);
  } finally {
    isAuthenticated.value = false;
    currentUser.value = null;
    currentTab.value = 'dashboard';
    showPublicPortal.value = false;
    triggerToast({ message: 'Has cerrado sesión correctamente.', type: 'info' });
  }
};

const checkSession = async () => {
  try {
    const data = await api.auth.verify();
    if (data?.autenticado) {
      isAuthenticated.value = true;
      currentUser.value = data.usuario;
      currentTab.value = data.usuario.rol === 'Admin' ? 'dashboard' : 'public';
      if (data.usuario.rol === 'Admin') loadStats();
    }
  } catch {
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
