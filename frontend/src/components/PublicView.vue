<template>
  <div class="card-panel">
    <!-- Header -->
    <div class="panel-header" style="margin-bottom: 2rem;">
      <div class="panel-title-group">
        <h2><span>🌐</span> Portal Público eSports</h2>
        <p class="panel-subtitle">Consulta jugadores y rosters de League of Legends sin necesidad de cuenta</p>
      </div>
      <button class="btn btn-primary" @click="$emit('go-login')">
        🔑 Iniciar Sesión / Registrarse
      </button>
    </div>

    <!-- Tabs: Jugadores / Rosters -->
    <div style="display: flex; gap: 0.75rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
      <button
        class="btn"
        :class="activeTab === 'jugadores' ? 'btn-cyan' : 'btn-secondary'"
        @click="activeTab = 'jugadores'"
      >
        👥 Jugadores
      </button>
      <button
        class="btn"
        :class="activeTab === 'rosters' ? 'btn-cyan' : 'btn-secondary'"
        @click="activeTab = 'rosters'"
      >
        🛡️ Rosters
      </button>
    </div>

    <!-- ── SECCIÓN JUGADORES ─────────────────────────────────────────── -->
    <div v-if="activeTab === 'jugadores'">
      <!-- Filtros -->
      <div class="filter-bar" style="margin-bottom: 1rem;">
        <div class="search-box">
          <input
            v-model="jugFilters.search"
            type="text"
            class="input-control"
            placeholder="Buscar por nickname..."
            @input="debounceJugadores"
            data-testid="public-search-jugadores"
          />
        </div>
        <select v-model="jugFilters.rol" class="select-control" @change="fetchJugadores" data-testid="public-filter-rol">
          <option value="Todos">Todos los Roles</option>
          <option value="Top">Top</option>
          <option value="Jungle">Jungle</option>
          <option value="Mid">Mid</option>
          <option value="ADC">ADC</option>
          <option value="Support">Support</option>
        </select>
        <select v-model="jugFilters.estado" class="select-control" @change="fetchJugadores" data-testid="public-filter-estado">
          <option value="Todos">Todos los Estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <button class="btn btn-secondary btn-sm" @click="resetJugFilters">🔄 Limpiar</button>
      </div>

      <div v-if="loadingJug" style="text-align: center; padding: 3rem; color: var(--cyan-neon);">
        ⏳ Cargando jugadores...
      </div>
      <div v-else-if="jugadores.length === 0" style="text-align: center; padding: 3rem; color: var(--text-muted);">
        No se encontraron jugadores.
      </div>
      <div v-else class="table-wrapper">
        <table class="data-table" data-testid="public-tabla-jugadores">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nickname</th>
              <th>Nombre Real</th>
              <th>País</th>
              <th>Rol</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="j in jugadores" :key="j.id" :data-testid="`jugador-row-${j.id}`">
              <td style="color: var(--text-dim); font-family: var(--font-display);">#{{ j.id }}</td>
              <td style="font-weight: 700; color: #fff;">{{ j.nickname }}</td>
              <td style="color: var(--text-muted);">{{ j.nombre_real || '—' }}</td>
              <td>{{ j.pais || '—' }}</td>
              <td>
                <span class="role-badge" :class="j.rol.toLowerCase()">{{ j.rol }}</span>
              </td>
              <td>
                <span class="status-badge" :class="j.estado">● {{ j.estado }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p style="color: var(--text-dim); font-size: 0.8rem; margin-top: 0.5rem;">
          {{ jugadores.length }} jugador(es) encontrado(s)
        </p>
      </div>
    </div>

    <!-- ── SECCIÓN ROSTERS ──────────────────────────────────────────── -->
    <div v-if="activeTab === 'rosters'">
      <div v-if="loadingRosters" style="text-align: center; padding: 3rem; color: var(--cyan-neon);">
        ⏳ Cargando rosters...
      </div>
      <div v-else-if="rosters.length === 0" style="text-align: center; padding: 3rem; color: var(--text-muted);">
        No hay rosters disponibles.
      </div>
      <div v-else>
        <div
          v-for="r in rosters"
          :key="r.id"
          class="card-panel"
          style="margin-bottom: 1rem; cursor: pointer;"
          @click="toggleRoster(r.id)"
          :data-testid="`roster-card-${r.id}`"
        >
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="color: var(--cyan-neon); margin: 0 0 0.25rem 0;">🛡️ {{ r.nombre }}</h3>
              <p style="margin: 0; color: var(--text-muted); font-size: 0.85rem;">
                Tipo: {{ r.tipo }} &bull; Temporada: {{ r.temporada }}
              </p>
            </div>
            <span style="color: var(--text-dim);">{{ expandedRoster === r.id ? '▲' : '▼' }}</span>
          </div>

          <!-- Jugadores del roster (expandible) -->
          <div v-if="expandedRoster === r.id" style="margin-top: 1rem;">
            <div v-if="loadingRosterJug" style="color: var(--cyan-neon); font-size: 0.85rem;">
              ⏳ Cargando alineación...
            </div>
            <div v-else-if="!rosterJugadores[r.id] || rosterJugadores[r.id].length === 0"
              style="color: var(--text-muted); font-size: 0.85rem;">
              Sin jugadores asignados en este roster.
            </div>
            <table v-else class="data-table" style="margin-top: 0.5rem;" :data-testid="`roster-jugadores-${r.id}`">
              <thead>
                <tr>
                  <th>Nickname</th>
                  <th>Rol en Liga</th>
                  <th>Rol en Roster</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="jug in rosterJugadores[r.id]" :key="jug.id">
                  <td style="font-weight: 700; color: #fff;">{{ jug.nickname }}</td>
                  <td><span class="role-badge" :class="jug.rol.toLowerCase()">{{ jug.rol }}</span></td>
                  <td>
                    <span :style="{ color: (jug.Roster_Jugador?.rol_en_roster || jug.rol_en_roster) === 'Titular' ? 'var(--cyan-neon)' : 'var(--text-muted)' }">
                      {{ jug.Roster_Jugador?.rol_en_roster || jug.rol_en_roster }}
                    </span>
                  </td>
                  <td><span class="status-badge" :class="jug.estado">● {{ jug.estado }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { api } from '../services/api.js';

defineEmits(['go-login']);

const activeTab = ref('jugadores');

// Jugadores
const jugadores = ref([]);
const loadingJug = ref(false);
const jugFilters = reactive({ search: '', rol: 'Todos', estado: 'Todos' });

let jugSearchTimeout = null;
const debounceJugadores = () => {
  clearTimeout(jugSearchTimeout);
  jugSearchTimeout = setTimeout(fetchJugadores, 300);
};

const resetJugFilters = () => {
  jugFilters.search = '';
  jugFilters.rol = 'Todos';
  jugFilters.estado = 'Todos';
  fetchJugadores();
};

const fetchJugadores = async () => {
  loadingJug.value = true;
  try {
    const data = await api.jugadores.getAll(jugFilters);
    jugadores.value = data || [];
  } catch (err) {
    console.error('Error cargando jugadores públicos:', err);
  } finally {
    loadingJug.value = false;
  }
};

// Rosters
const rosters = ref([]);
const loadingRosters = ref(false);
const expandedRoster = ref(null);
const rosterJugadores = ref({});
const loadingRosterJug = ref(false);

const fetchRosters = async () => {
  loadingRosters.value = true;
  try {
    const data = await api.rosters.getAll();
    rosters.value = data || [];
  } catch (err) {
    console.error('Error cargando rosters públicos:', err);
  } finally {
    loadingRosters.value = false;
  }
};

const toggleRoster = async (rosterId) => {
  if (expandedRoster.value === rosterId) {
    expandedRoster.value = null;
    return;
  }
  expandedRoster.value = rosterId;
  if (!rosterJugadores.value[rosterId]) {
    loadingRosterJug.value = true;
    try {
      const data = await api.rosterJugadores.getJugadores(rosterId);
      rosterJugadores.value[rosterId] = data || [];
    } catch (err) {
      console.error('Error cargando jugadores del roster:', err);
      rosterJugadores.value[rosterId] = [];
    } finally {
      loadingRosterJug.value = false;
    }
  }
};

onMounted(() => {
  fetchJugadores();
  fetchRosters();
});
</script>
