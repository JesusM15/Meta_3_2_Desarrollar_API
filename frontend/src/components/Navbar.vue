<template>
  <header class="app-header">
    <div class="brand-section">
      <div class="brand-logo-icon">⚡</div>
      <div>
        <h1 class="brand-title">eSports Roster Ops</h1>
        <p class="brand-subtitle">Operaciones &bull; League of Legends</p>
      </div>
    </div>

    <nav class="nav-tabs">
      <!-- Tabs de Admin -->
      <template v-if="user?.rol === 'Admin'">
        <button
          class="nav-tab-btn"
          :class="{ active: currentTab === 'dashboard' }"
          @click="$emit('change-tab', 'dashboard')"
          data-testid="tab-dashboard"
        >
          <span>📊</span> Dashboard
        </button>
        <button
          class="nav-tab-btn"
          :class="{ active: currentTab === 'jugadores' }"
          @click="$emit('change-tab', 'jugadores')"
          data-testid="tab-jugadores"
        >
          <span>👥</span> Jugadores
        </button>
        <button
          class="nav-tab-btn"
          :class="{ active: currentTab === 'rosters' }"
          @click="$emit('change-tab', 'rosters')"
          data-testid="tab-rosters"
        >
          <span>🛡️</span> Rosters & Alineación
        </button>
        <button
          class="nav-tab-btn"
          :class="{ active: currentTab === 'usuarios' }"
          @click="$emit('change-tab', 'usuarios')"
          data-testid="tab-usuarios"
        >
          <span>👤</span> Usuarios
        </button>
        <button
          class="nav-tab-btn"
          :class="{ active: currentTab === 'seguridad' }"
          @click="$emit('change-tab', 'seguridad')"
          data-testid="tab-seguridad"
        >
          <span>🔐</span> Seguridad
        </button>
      </template>

      <!-- Tabs de Public -->
      <template v-else-if="user?.rol === 'Public'">
        <button
          class="nav-tab-btn"
          :class="{ active: currentTab === 'public' }"
          @click="$emit('change-tab', 'public')"
          data-testid="tab-public"
        >
          <span>🌐</span> Portal Público
        </button>
      </template>
    </nav>

    <div class="header-user-section">
      <div class="security-badge pulse" title="Sesión activa y protegida con JWT + CSRF">
        <span>🛡️</span> Sesión Segura
      </div>

      <div class="user-pill">
        <span>👤</span>
        <span>{{ user?.email }}</span>
        <span
          class="user-role-tag"
          :style="{ background: user?.rol === 'Admin' ? 'rgba(56,189,248,0.2)' : 'rgba(168,85,247,0.2)' }"
        >
          {{ user?.rol }}
        </span>
      </div>

      <button class="btn-logout" @click="$emit('logout')" title="Cerrar sesión" data-testid="btn-logout">
        <span>🚪</span> Salir
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  currentTab: {
    type: String,
    default: 'dashboard'
  },
  user: {
    type: Object,
    default: () => ({ email: '', rol: 'Public' })
  }
});

defineEmits(['change-tab', 'logout']);
</script>
