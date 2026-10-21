<template>
  <div class="card-panel">
    <div class="panel-header">
      <div class="panel-title-group">
        <h2><span>👥</span> Gestión de Jugadores</h2>
        <p class="panel-subtitle">Administración de perfiles profesionales de eSports</p>
      </div>

      <button class="btn btn-primary" @click="openCreateModal">
        <span>+</span> Nuevo Jugador
      </button>
    </div>

    <!-- Search & Filter Controls -->
    <div class="filter-bar">
      <div class="search-box">
        <input 
          v-model="filters.search" 
          type="text" 
          class="input-control" 
          placeholder="Buscar por nickname (ej. Faker, Caps)..." 
          @input="debounceSearch"
        />
      </div>

      <select v-model="filters.rol" class="select-control" @change="fetchJugadores">
        <option value="Todos">Todos los Roles</option>
        <option value="Top">Top</option>
        <option value="Jungle">Jungle</option>
        <option value="Mid">Mid</option>
        <option value="ADC">ADC</option>
        <option value="Support">Support</option>
      </select>

      <select v-model="filters.estado" class="select-control" @change="fetchJugadores">
        <option value="Todos">Todos los Estados</option>
        <option value="activo">Activo</option>
        <option value="inactivo">Inactivo</option>
      </select>

      <button class="btn btn-secondary btn-sm" @click="resetFilters" title="Limpiar filtros">
        <span>🔄</span> Limpiar
      </button>
    </div>

    <!-- Table -->
    <div v-if="loading" style="text-align: center; padding: 3rem; color: var(--cyan-neon);">
      ⏳ Cargando lista de jugadores...
    </div>

    <div v-else-if="jugadores.length === 0" style="text-align: center; padding: 3rem; color: var(--text-muted);">
      No se encontraron jugadores con los filtros seleccionados.
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nickname</th>
            <th>Nombre Real</th>
            <th>País</th>
            <th>Rol Principal</th>
            <th>Estado</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="jugador in jugadores" :key="jugador.id">
            <td style="color: var(--text-dim); font-family: var(--font-display);">#{{ jugador.id }}</td>
            <td style="font-weight: 700; color: #fff; font-size: 1rem;">
              {{ jugador.nickname }}
            </td>
            <td style="color: var(--text-muted);">{{ jugador.nombre_real || '—' }}</td>
            <td>{{ jugador.pais || '—' }}</td>
            <td>
              <span class="role-badge" :class="jugador.rol.toLowerCase()">
                {{ jugador.rol }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="jugador.estado">
                ● {{ jugador.estado }}
              </span>
            </td>
            <td style="text-align: right;">
              <div style="display: inline-flex; gap: 0.5rem;">
                <button class="btn btn-secondary btn-sm" @click="openEditModal(jugador)">
                  ✏️ Editar
                </button>
                <button class="btn btn-danger btn-sm" @click="confirmDelete(jugador)">
                  🗑️ Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Form (Crear / Editar) -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ isEditing ? '✏️ Editar Jugador' : '➕ Registrar Nuevo Jugador' }}
          </h3>
          <button class="btn-close" @click="closeModal">&times;</button>
        </div>

        <div v-if="modalError" class="alert alert-danger">
          <span>⚠️</span> {{ modalError }}
        </div>

        <form @submit.prevent="saveJugador">
          <div class="form-group">
            <label class="form-label">Nickname (Único *):</label>
            <input 
              v-model="form.nickname" 
              type="text" 
              class="input-control" 
              placeholder="ej. Faker, Chovy, Caps" 
              required 
            />
          </div>

          <div class="form-group">
            <label class="form-label">Nombre Real:</label>
            <input 
              v-model="form.nombre_real" 
              type="text" 
              class="input-control" 
              placeholder="ej. Lee Sang-hyeok" 
            />
          </div>

          <div class="form-group">
            <label class="form-label">País:</label>
            <input 
              v-model="form.pais" 
              type="text" 
              class="input-control" 
              placeholder="ej. Corea del Sur, España" 
            />
          </div>

          <div class="form-group">
            <label class="form-label">Rol en League of Legends (*):</label>
            <select v-model="form.rol" class="select-control" style="width: 100%;" required>
              <option value="Top">Top</option>
              <option value="Jungle">Jungle</option>
              <option value="Mid">Mid</option>
              <option value="ADC">ADC</option>
              <option value="Support">Support</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Estado:</label>
            <select v-model="form.estado" class="select-control" style="width: 100%;">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving">Guardando...</span>
              <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Registrar Jugador' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
      <div class="modal-content" style="max-width: 440px;">
        <div class="modal-header">
          <h3 class="modal-title" style="color: var(--red-danger);">⚠️ Eliminar Jugador</h3>
          <button class="btn-close" @click="showDeleteModal = false">&times;</button>
        </div>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">
          ¿Estás seguro de que deseas eliminar al jugador <strong style="color: #fff;">{{ playerToDelete?.nickname }}</strong>? 
          Esta acción removerá también sus asignaciones en los rosters activos.
        </p>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteModal = false">Cancelar</button>
          <button class="btn btn-danger" :disabled="deleting" @click="executeDelete">
            <span v-if="deleting">Eliminando...</span>
            <span v-else>Sí, Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { api } from '../services/api.js';

const emit = defineEmits(['notify', 'refresh-stats']);

const jugadores = ref([]);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const filters = reactive({
  search: '',
  rol: 'Todos',
  estado: 'Todos'
});

const showModal = ref(false);
const isEditing = ref(false);
const modalError = ref('');

const form = reactive({
  id: null,
  nickname: '',
  nombre_real: '',
  pais: '',
  rol: 'Mid',
  estado: 'activo'
});

const showDeleteModal = ref(false);
const playerToDelete = ref(null);

let searchTimeout = null;
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchJugadores();
  }, 300);
};

const resetFilters = () => {
  filters.search = '';
  filters.rol = 'Todos';
  filters.estado = 'Todos';
  fetchJugadores();
};

const fetchJugadores = async () => {
  loading.value = true;
  try {
    const data = await api.jugadores.getAll(filters);
    jugadores.value = data || [];
  } catch (err) {
    emit('notify', { message: `Error al cargar jugadores: ${err.message}`, type: 'danger' });
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  modalError.value = '';
  form.id = null;
  form.nickname = '';
  form.nombre_real = '';
  form.pais = '';
  form.rol = 'Mid';
  form.estado = 'activo';
  showModal.value = true;
};

const openEditModal = (jugador) => {
  isEditing.value = true;
  modalError.value = '';
  form.id = jugador.id;
  form.nickname = jugador.nickname;
  form.nombre_real = jugador.nombre_real || '';
  form.pais = jugador.pais || '';
  form.rol = jugador.rol;
  form.estado = jugador.estado;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveJugador = async () => {
  saving.value = true;
  modalError.value = '';
  try {
    const payload = {
      nickname: form.nickname.trim(),
      nombre_real: form.nombre_real.trim() || null,
      pais: form.pais.trim() || null,
      rol: form.rol,
      estado: form.estado
    };

    if (isEditing.value) {
      await api.jugadores.update(form.id, payload);
      emit('notify', { message: `Jugador ${payload.nickname} actualizado con éxito.`, type: 'success' });
    } else {
      await api.jugadores.create(payload);
      emit('notify', { message: `Jugador ${payload.nickname} registrado con éxito.`, type: 'success' });
    }

    closeModal();
    fetchJugadores();
    emit('refresh-stats');
  } catch (err) {
    modalError.value = err.message;
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (jugador) => {
  playerToDelete.value = jugador;
  showDeleteModal.value = true;
};

const executeDelete = async () => {
  if (!playerToDelete.value) return;
  deleting.value = true;
  try {
    await api.jugadores.delete(playerToDelete.value.id);
    emit('notify', { message: `Jugador ${playerToDelete.value.nickname} eliminado correctamente.`, type: 'success' });
    showDeleteModal.value = false;
    fetchJugadores();
    emit('refresh-stats');
  } catch (err) {
    emit('notify', { message: `Error al eliminar jugador: ${err.message}`, type: 'danger' });
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  fetchJugadores();
});
</script>
