<template>
  <div>
    <!-- Metrics Grid -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon-box">👥</div>
        <div class="metric-data">
          <h3>{{ stats.totalJugadores }}</h3>
          <p>Jugadores Registrados</p>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon-box gold">🛡️</div>
        <div class="metric-data">
          <h3>{{ stats.totalRosters }}</h3>
          <p>Rosters en Competencia</p>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon-box green">⚔️</div>
        <div class="metric-data">
          <h3>{{ stats.titulares }}</h3>
          <p>Titulares en Alineación</p>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon-box purple">🪑</div>
        <div class="metric-data">
          <h3>{{ stats.suplentes }}</h3>
          <p>Suplentes en Banca</p>
        </div>
      </div>
    </div>

    <!-- Quick Access & Health Panel -->
    <div class="card-panel">
      <div class="panel-header">
        <div class="panel-title-group">
          <h2><span>⚡</span> Centro de Control del Administrador</h2>
          <p class="panel-subtitle">Acceso rápido a las operaciones principales del sistema de eSports</p>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button class="btn btn-primary" @click="$emit('navigate', 'jugadores')">
            <span>+</span> Nuevo Jugador
          </button>
          <button class="btn btn-cyan" @click="$emit('navigate', 'rosters')">
            <span>🛡️</span> Gestionar Rosters
          </button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
        <!-- Card 1: Estado del Sistema -->
        <div style="background: rgba(9, 14, 28, 0.7); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
          <h3 style="font-family: var(--font-display); font-size: 1.15rem; color: var(--text-gold); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>🟢</span> Estado del Backend & Conexión
          </h3>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.88rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Servidor REST:</span>
              <span style="color: var(--green-success); font-weight: 600;">En línea (v1.0.0)</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Base de Datos:</span>
              <span style="font-weight: 600;">{{ healthInfo?.database || 'Conectado' }} ({{ healthInfo?.dialect || 'MySQL' }})</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Protección CSRF:</span>
              <span style="color: var(--cyan-neon); font-weight: 600;">Doble Cookie Pattern (Activo)</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Almacenamiento JWT:</span>
              <span style="color: var(--gold-light); font-weight: 600;">Cookie HttpOnly (Anti-XSS)</span>
            </div>
          </div>
        </div>

        <!-- Card 2: Reglas de Negocio Validadas -->
        <div style="background: rgba(9, 14, 28, 0.7); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
          <h3 style="font-family: var(--font-display); font-size: 1.15rem; color: var(--cyan-neon); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>📐</span> Reglas de Negocio del Sistema
          </h3>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.45rem; font-size: 0.84rem; color: var(--text-muted);">
            <li><strong style="color: #fff;">RN-01:</strong> Nicknames únicos a nivel global (409 Conflict).</li>
            <li><strong style="color: #fff;">RN-02:</strong> Máximo 5 titulares por roster (Top, Jungle, Mid, ADC, Support).</li>
            <li><strong style="color: #fff;">RN-03:</strong> Posiciones únicas entre titulares (sin duplicados).</li>
            <li><strong style="color: #fff;">RN-04:</strong> Jugadores pueden integrar más de un roster.</li>
            <li><strong style="color: #fff;">RN-05:</strong> Borrar un roster preserva a los jugadores en la base de datos.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    default: () => ({
      totalJugadores: 0,
      totalRosters: 0,
      titulares: 0,
      suplentes: 0
    })
  },
  healthInfo: {
    type: Object,
    default: () => null
  }
});

defineEmits(['navigate']);
</script>
