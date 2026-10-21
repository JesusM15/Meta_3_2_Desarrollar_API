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
      <button 
        class="nav-tab-btn" 
        :class="{ active: currentTab === 'dashboard' }"
        @click="$emit('change-tab', 'dashboard')"
      >
        <span>📊</span> Dashboard
      </button>
      <button 
        class="nav-tab-btn" 
        :class="{ active: currentTab === 'jugadores' }"
        @click="$emit('change-tab', 'jugadores')"
      >
        <span>👥</span> Jugadores
      </button>
      <button 
        class="nav-tab-btn" 
        :class="{ active: currentTab === 'rosters' }"
        @click="$emit('change-tab', 'rosters')"
      >
        <span>🛡️</span> Rosters & Alineación
      </button>
      <button 
        class="nav-tab-btn" 
        :class="{ active: currentTab === 'seguridad' }"
        @click="$emit('change-tab', 'seguridad')"
      >
        <span>🔐</span> Centro de Seguridad
      </button>
    </nav>

    <div class="header-user-section">
      <div class="security-badge pulse" title="Sesión activa y protegida con doble token">
        <span>🛡️</span> Sesión Segura
      </div>

      <div class="user-pill">
        <span>👤</span>
        <span>{{ user?.email || 'admin@esports.com' }}</span>
        <span class="user-role-tag">Admin</span>
      </div>

      <button class="btn-logout" @click="$emit('logout')" title="Cerrar sesión">
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
    default: () => ({ email: 'admin@esports.com', rol: 'Admin' })
  }
});

defineEmits(['change-tab', 'logout']);
</script>
