<template>
  <div>
    <!-- Roster Selector & Actions Bar -->
    <div class="card-panel">
      <div class="panel-header">
        <div class="panel-title-group">
          <h2><span>🛡️</span> Rosters & Alineación Táctica</h2>
          <p class="panel-subtitle">Gestión de equipos competitivos y configuración de alineaciones en League of Legends</p>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button class="btn btn-primary" @click="openCreateRosterModal">
            <span>+</span> Nuevo Roster
          </button>
          <button v-if="selectedRoster" class="btn btn-secondary" @click="openEditRosterModal">
            <span>✏️</span> Editar Roster
          </button>
          <button v-if="selectedRoster" class="btn btn-danger" @click="confirmDeleteRoster">
            <span>🗑️</span> Eliminar Roster
          </button>
        </div>
      </div>

      <!-- Roster Tabs / Selector -->
      <div style="display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem; margin-top: 1rem;">
        <button 
          v-for="r in rosters" 
          :key="r.id"
          class="btn"
          :class="selectedRoster?.id === r.id ? 'btn-cyan' : 'btn-secondary'"
          @click="selectRoster(r)"
          style="white-space: nowrap;"
        >
          <span>🛡️</span> {{ r.nombre }}
          <span style="opacity: 0.7; font-size: 0.75rem;">({{ r.tipo }} &bull; {{ r.temporada }})</span>
        </button>
      </div>
    </div>

    <!-- Loading Indicator -->
    <div v-if="loading" class="card-panel" style="text-align: center; color: var(--cyan-neon); padding: 3rem;">
      ⏳ Cargando datos del roster y alineación...
    </div>

    <!-- Empty State -->
    <div v-else-if="!selectedRoster" class="card-panel" style="text-align: center; color: var(--text-muted); padding: 3rem;">
      No hay ningún roster seleccionado. Cree o seleccione un roster para armar la alineación.
    </div>

    <!-- Active Roster Tactical Board -->
    <div v-else class="tactics-board">
      <div class="tactics-board-header">
        <div class="roster-summary-tag">
          <h3 style="font-family: var(--font-display); font-size: 1.85rem; color: #fff;">
            {{ selectedRoster.nombre }}
          </h3>
          <span class="type-badge" :class="selectedRoster.tipo.toLowerCase()">
            {{ selectedRoster.tipo }}
          </span>
          <span style="color: var(--text-muted); font-size: 0.9rem;">
            🎮 {{ selectedRoster.juego }} &bull; 🗓️ Temporada {{ selectedRoster.temporada }}
          </span>
        </div>

        <button class="btn btn-primary" @click="openAssignModal(null)">
          <span>+</span> Asignar Jugador al Roster
        </button>
      </div>

      <!-- Summoner's Rift 5-Slot Grid for Starters (Titulares) -->
      <h4 style="font-family: var(--font-display); font-size: 1.25rem; color: var(--text-gold); margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
        <span>⚔️ Alineación Titular (Máximo 5 - Posiciones Únicas)</span>
        <span style="font-size: 0.85rem; color: var(--text-muted);">
          {{ titularesCount }}/5 Titulares
        </span>
      </h4>

      <div class="slots-grid">
        <div 
          v-for="role in positionSlots" 
          :key="role" 
          class="slot-card"
          :class="getStarterByRole(role) ? 'assigned' : 'empty'"
        >
          <div class="slot-role-header" :style="{ color: getRoleColor(role) }">
            <span>{{ getRoleIcon(role) }}</span> {{ role }}
          </div>

          <!-- If a player is assigned to this role -->
          <template v-if="getStarterByRole(role)">
            <div class="slot-avatar" :style="{ borderColor: getRoleColor(role) }">
              {{ getStarterByRole(role).nickname.charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="slot-player-name">{{ getStarterByRole(role).nickname }}</div>
              <div class="slot-player-sub">{{ getStarterByRole(role).nombre_real || getStarterByRole(role).pais || 'Titular' }}</div>
            </div>

            <div class="slot-actions">
              <button 
                class="btn btn-secondary btn-sm" 
                @click="changePlayerRole(getStarterByRole(role), 'Suplente')"
                title="Mover a la banca de suplentes"
              >
                🪑 Suplente
              </button>
              <button 
                class="btn btn-danger btn-sm" 
                @click="removePlayerFromRoster(getStarterByRole(role))"
                title="Quitar del roster"
              >
                ✕
              </button>
            </div>
          </template>

          <!-- If slot is empty -->
          <template v-else>
            <div style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 1rem;">
              Sin Titular Asignado
            </div>
            <button class="btn btn-secondary btn-sm" @click="openAssignModal(role)">
              <span>+</span> Asignar {{ role }}
            </button>
          </template>
        </div>
      </div>

      <!-- Banca de Suplentes -->
      <div class="bench-section">
        <div class="bench-header">
          <h4 style="font-family: var(--font-display); font-size: 1.2rem; color: var(--cyan-neon); display: flex; align-items: center; gap: 0.5rem;">
            <span>🪑</span> Banca de Suplentes ({{ suplentes.length }})
          </h4>
          <span style="font-size: 0.8rem; color: var(--text-muted);">
            RN-04: Un jugador puede estar como suplente en múltiples rosters
          </span>
        </div>

        <div v-if="suplentes.length === 0" style="color: var(--text-dim); font-size: 0.9rem; padding: 1rem 0;">
          No hay jugadores suplentes en este roster.
        </div>

        <div v-else class="bench-grid">
          <div v-for="jug in suplentes" :key="jug.id" class="bench-card">
            <div>
              <div style="font-weight: 700; color: #fff;">{{ jug.nickname }}</div>
              <div style="font-size: 0.78rem; display: flex; gap: 0.4rem; align-items: center; margin-top: 0.2rem;">
                <span class="role-badge" :class="jug.rol.toLowerCase()" style="font-size: 0.65rem; padding: 0.1rem 0.4rem;">
                  {{ jug.rol }}
                </span>
                <span style="color: var(--text-muted);">{{ jug.nombre_real || jug.pais || '' }}</span>
              </div>
            </div>

            <div style="display: flex; gap: 0.4rem;">
              <button 
                class="btn btn-primary btn-sm" 
                @click="changePlayerRole(jug, 'Titular')"
                title="Promover a Titular"
              >
                ⚔️ Titular
              </button>
              <button 
                class="btn btn-danger btn-sm" 
                @click="removePlayerFromRoster(jug)"
                title="Quitar de este roster"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form (Crear / Editar Roster) -->
    <div v-if="showRosterModal" class="modal-backdrop" @click.self="showRosterModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ isEditingRoster ? '✏️ Editar Roster' : '➕ Crear Nuevo Roster' }}
          </h3>
          <button class="btn-close" @click="showRosterModal = false">&times;</button>
        </div>

        <div v-if="rosterModalError" class="alert alert-danger">
          <span>⚠️</span> {{ rosterModalError }}
        </div>

        <form @submit.prevent="saveRoster">
          <div class="form-group">
            <label class="form-label">Nombre del Roster / Equipo (*):</label>
            <input 
              v-model="rosterForm.nombre" 
              type="text" 
              class="input-control" 
              placeholder="ej. T1, G2 Esports, Cloud9" 
              required 
            />
          </div>

          <div class="form-group">
            <label class="form-label">Juego:</label>
            <input 
              v-model="rosterForm.juego" 
              type="text" 
              class="input-control" 
              placeholder="League of Legends" 
              required 
            />
          </div>

          <div class="form-group">
            <label class="form-label">Tipo de Roster (*):</label>
            <select v-model="rosterForm.tipo" class="select-control" style="width: 100%;" required>
              <option value="Principal">Principal</option>
              <option value="Academy">Academy</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Temporada (*):</label>
            <input 
              v-model="rosterForm.temporada" 
              type="text" 
              class="input-control" 
              placeholder="2026" 
              required 
            />
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showRosterModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="savingRoster">
              <span v-if="savingRoster">Guardando...</span>
              <span v-else>{{ isEditingRoster ? 'Guardar Cambios' : 'Crear Roster' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Form (Asignar Jugador a Roster) -->
    <div v-if="showAssignModal" class="modal-backdrop" @click.self="showAssignModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">➕ Asignar Jugador al Roster</h3>
          <button class="btn-close" @click="showAssignModal = false">&times;</button>
        </div>

        <div v-if="assignModalError" class="alert alert-danger">
          <span>⚠️</span> {{ assignModalError }}
        </div>

        <form @submit.prevent="executeAssignJugador">
          <div class="form-group">
            <label class="form-label">Seleccionar Jugador (*):</label>
            <select v-model="assignForm.id_jugador" class="select-control" style="width: 100%;" required>
              <option :value="null" disabled>-- Elija un jugador --</option>
              <option 
                v-for="j in availablePlayers" 
                :key="j.id" 
                :value="j.id"
              >
                {{ j.nickname }} ({{ j.rol }}) &bull; {{ j.nombre_real || j.pais || 'Activo' }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Rol en el Roster (*):</label>
            <select v-model="assignForm.rol_en_roster" class="select-control" style="width: 100%;" required>
              <option value="Titular">Titular (Máximo 5, posición única)</option>
              <option value="Suplente">Suplente</option>
            </select>
          </div>

          <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 0.5rem;">
            📌 <strong>Reglas aplicadas por el servidor:</strong> RN-02 (Máx. 5 titulares) y RN-03 (Sin titulares duplicados en el mismo rol).
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAssignModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="assigning">
              <span v-if="assigning">Asignando...</span>
              <span v-else>Asignar al Roster</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirm Delete Roster Modal -->
    <div v-if="showDeleteRosterModal" class="modal-backdrop" @click.self="showDeleteRosterModal = false">
      <div class="modal-content" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title" style="color: var(--red-danger);">⚠️ Eliminar Roster</h3>
          <button class="btn-close" @click="showDeleteRosterModal = false">&times;</button>
        </div>
        <p style="color: var(--text-main); font-size: 0.95rem; margin-bottom: 1rem;">
          ¿Estás seguro de que deseas eliminar el roster <strong style="color: var(--gold-light);">{{ selectedRoster?.nombre }}</strong>?
        </p>
        <div class="alert alert-info" style="font-size: 0.82rem; margin-bottom: 1.5rem;">
          <span>🛡️</span> <strong>Garantía RN-05:</strong> Al eliminar este roster, sus jugadores <strong>NO</strong> se borrarán de la base de datos (únicamente se eliminan las relaciones en la tabla pivote).
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteRosterModal = false">Cancelar</button>
          <button class="btn btn-danger" :disabled="deletingRoster" @click="executeDeleteRoster">
            <span v-if="deletingRoster">Eliminando...</span>
            <span v-else>Confirmar Eliminación</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { api } from '../services/api.js';

const emit = defineEmits(['notify', 'refresh-stats']);

const positionSlots = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];

const rosters = ref([]);
const selectedRoster = ref(null);
const rosterJugadores = ref([]);
const allJugadores = ref([]);
const loading = ref(false);

// Formulario de Roster
const showRosterModal = ref(false);
const isEditingRoster = ref(false);
const savingRoster = ref(false);
const rosterModalError = ref('');
const rosterForm = reactive({
  id: null,
  nombre: '',
  juego: 'League of Legends',
  tipo: 'Principal',
  temporada: '2026'
});

// Formulario de Asignación
const showAssignModal = ref(false);
const assigning = ref(false);
const assignModalError = ref('');
const assignForm = reactive({
  id_jugador: null,
  rol_en_roster: 'Titular'
});

// Eliminación de Roster
const showDeleteRosterModal = ref(false);
const deletingRoster = ref(false);

const titulares = computed(() => {
  return rosterJugadores.value.filter(
    (j) => j.Roster_Jugador?.rol_en_roster === 'Titular' || j.rol_en_roster === 'Titular'
  );
});

const suplentes = computed(() => {
  return rosterJugadores.value.filter(
    (j) => j.Roster_Jugador?.rol_en_roster === 'Suplente' || j.rol_en_roster === 'Suplente'
  );
});

const titularesCount = computed(() => titulares.value.length);

const availablePlayers = computed(() => {
  // Filtramos los jugadores que aún no están en este roster
  const assignedIds = new Set(rosterJugadores.value.map((j) => j.id));
  return allJugadores.value.filter((j) => !assignedIds.has(j.id));
});

const getStarterByRole = (role) => {
  return titulares.value.find((j) => j.rol?.toLowerCase() === role.toLowerCase());
};

const getRoleColor = (role) => {
  const map = {
    Top: 'var(--role-top)',
    Jungle: 'var(--role-jungle)',
    Mid: 'var(--role-mid)',
    ADC: 'var(--role-adc)',
    Support: 'var(--role-support)'
  };
  return map[role] || 'var(--text-main)';
};

const getRoleIcon = (role) => {
  const map = {
    Top: '🛡️',
    Jungle: '🌲',
    Mid: '⚡',
    ADC: '🏹',
    Support: '🔮'
  };
  return map[role] || '⚔️';
};

const fetchRosters = async () => {
  loading.value = true;
  try {
    const data = await api.rosters.getAll();
    rosters.value = data || [];
    if (rosters.value.length > 0) {
      if (!selectedRoster.value) {
        selectRoster(rosters.value[0]);
      } else {
        const found = rosters.value.find((r) => r.id === selectedRoster.value.id);
        selectRoster(found || rosters.value[0]);
      }
    } else {
      selectedRoster.value = null;
      rosterJugadores.value = [];
    }
  } catch (err) {
    emit('notify', { message: `Error al cargar rosters: ${err.message}`, type: 'danger' });
  } finally {
    loading.value = false;
  }
};

const fetchAllJugadores = async () => {
  try {
    const data = await api.jugadores.getAll();
    allJugadores.value = data || [];
  } catch (err) {
    console.error('Error cargando jugadores disponibles:', err);
  }
};

const selectRoster = async (roster) => {
  selectedRoster.value = roster;
  if (!roster) {
    rosterJugadores.value = [];
    return;
  }
  try {
    const data = await api.rosterJugadores.getJugadores(roster.id);
    rosterJugadores.value = data || [];
  } catch (err) {
    emit('notify', { message: `Error al cargar alineación del roster: ${err.message}`, type: 'danger' });
  }
};

const openCreateRosterModal = () => {
  isEditingRoster.value = false;
  rosterModalError.value = '';
  rosterForm.id = null;
  rosterForm.nombre = '';
  rosterForm.juego = 'League of Legends';
  rosterForm.tipo = 'Principal';
  rosterForm.temporada = '2026';
  showRosterModal.value = true;
};

const openEditRosterModal = () => {
  if (!selectedRoster.value) return;
  isEditingRoster.value = true;
  rosterModalError.value = '';
  rosterForm.id = selectedRoster.value.id;
  rosterForm.nombre = selectedRoster.value.nombre;
  rosterForm.juego = selectedRoster.value.juego;
  rosterForm.tipo = selectedRoster.value.tipo;
  rosterForm.temporada = selectedRoster.value.temporada;
  showRosterModal.value = true;
};

const saveRoster = async () => {
  savingRoster.value = true;
  rosterModalError.value = '';
  try {
    const payload = {
      nombre: rosterForm.nombre.trim(),
      juego: rosterForm.juego.trim(),
      tipo: rosterForm.tipo,
      temporada: rosterForm.temporada.trim()
    };

    if (isEditingRoster.value) {
      await api.rosters.update(rosterForm.id, payload);
      emit('notify', { message: `Roster ${payload.nombre} actualizado con éxito.`, type: 'success' });
    } else {
      const created = await api.rosters.create(payload);
      emit('notify', { message: `Roster ${payload.nombre} creado con éxito.`, type: 'success' });
      selectedRoster.value = created;
    }

    showRosterModal.value = false;
    fetchRosters();
    emit('refresh-stats');
  } catch (err) {
    rosterModalError.value = err.message;
  } finally {
    savingRoster.value = false;
  }
};

const confirmDeleteRoster = () => {
  if (!selectedRoster.value) return;
  showDeleteRosterModal.value = true;
};

const executeDeleteRoster = async () => {
  if (!selectedRoster.value) return;
  deletingRoster.value = true;
  try {
    await api.rosters.delete(selectedRoster.value.id);
    emit('notify', { 
      message: `Roster ${selectedRoster.value.nombre} eliminado. Los jugadores se preservaron en la base de datos (RN-05).`, 
      type: 'success' 
    });
    showDeleteRosterModal.value = false;
    selectedRoster.value = null;
    fetchRosters();
    emit('refresh-stats');
  } catch (err) {
    emit('notify', { message: `Error al eliminar roster: ${err.message}`, type: 'danger' });
  } finally {
    deletingRoster.value = false;
  }
};

const openAssignModal = (suggestedRole = null) => {
  fetchAllJugadores();
  assignModalError.value = '';
  assignForm.id_jugador = null;
  assignForm.rol_en_roster = suggestedRole ? 'Titular' : 'Titular';

  // Si se sugirió un rol (ej. 'Top'), buscar si hay un jugador disponible con ese rol
  if (suggestedRole) {
    const match = availablePlayers.value.find(
      (j) => j.rol?.toLowerCase() === suggestedRole.toLowerCase()
    );
    if (match) {
      assignForm.id_jugador = match.id;
    }
  }

  showAssignModal.value = true;
};

const executeAssignJugador = async () => {
  if (!selectedRoster.value || !assignForm.id_jugador) return;
  assigning.value = true;
  assignModalError.value = '';
  try {
    await api.rosterJugadores.assign(selectedRoster.value.id, {
      id_jugador: assignForm.id_jugador,
      rol_en_roster: assignForm.rol_en_roster
    });

    emit('notify', { message: 'Jugador asignado al roster exitosamente.', type: 'success' });
    showAssignModal.value = false;
    selectRoster(selectedRoster.value);
    emit('refresh-stats');
  } catch (err) {
    assignModalError.value = err.message;
  } finally {
    assigning.value = false;
  }
};

const changePlayerRole = async (jugador, nuevoRol) => {
  if (!selectedRoster.value) return;
  try {
    await api.rosterJugadores.updateRol(selectedRoster.value.id, jugador.id, nuevoRol);
    emit('notify', { 
      message: `Rol de ${jugador.nickname} actualizado a ${nuevoRol}.`, 
      type: 'success' 
    });
    selectRoster(selectedRoster.value);
    emit('refresh-stats');
  } catch (err) {
    emit('notify', { message: `Error al actualizar rol: ${err.message}`, type: 'danger' });
  }
};

const removePlayerFromRoster = async (jugador) => {
  if (!selectedRoster.value) return;
  try {
    await api.rosterJugadores.remove(selectedRoster.value.id, jugador.id);
    emit('notify', { 
      message: `${jugador.nickname} fue retirado del roster. El jugador sigue existiendo en el sistema.`, 
      type: 'success' 
    });
    selectRoster(selectedRoster.value);
    emit('refresh-stats');
  } catch (err) {
    emit('notify', { message: `Error al quitar jugador: ${err.message}`, type: 'danger' });
  }
};

onMounted(() => {
  fetchRosters();
  fetchAllJugadores();
});
</script>
