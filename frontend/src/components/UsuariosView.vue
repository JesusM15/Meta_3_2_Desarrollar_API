<template>
  <div class="card-panel">
    <div class="panel-header">
      <div class="panel-title-group">
        <h2><span>👤</span> Gestión de Usuarios</h2>
        <p class="panel-subtitle">Usuarios registrados en el sistema (Admin y Public)</p>
      </div>
      <button class="btn btn-secondary btn-sm" @click="fetchUsuarios">🔄 Recargar</button>
    </div>

    <div v-if="loading" style="text-align: center; padding: 3rem; color: var(--cyan-neon);">
      ⏳ Cargando usuarios...
    </div>

    <div v-else-if="usuarios.length === 0" style="text-align: center; padding: 3rem; color: var(--text-muted);">
      No hay usuarios registrados aún.
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table" data-testid="tabla-usuarios">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Último Acceso</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.id" :data-testid="`usuario-row-${u.id}`">
            <td style="color: var(--text-dim);">#{{ u.id }}</td>
            <td style="font-weight: 600; color: #fff;">{{ u.nombre }}</td>
            <td style="color: var(--text-muted);">{{ u.email }}</td>
            <td>
              <span
                :style="{
                  display: 'inline-block',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  background: u.rol === 'Admin' ? 'rgba(56,189,248,0.15)' : 'rgba(168,85,247,0.15)',
                  color: u.rol === 'Admin' ? 'var(--cyan-neon)' : '#a855f7',
                  border: `1px solid ${u.rol === 'Admin' ? 'var(--cyan-neon)' : '#a855f7'}`
                }"
              >
                {{ u.rol }}
              </span>
            </td>
            <td style="color: var(--text-dim); font-size: 0.85rem;">
              {{ u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-MX') : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
      <p style="color: var(--text-dim); font-size: 0.8rem; margin-top: 0.5rem;">
        {{ usuarios.length }} usuario(s) en el sistema
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../services/api.js';

const emit = defineEmits(['notify']);

const usuarios = ref([]);
const loading = ref(false);

const fetchUsuarios = async () => {
  loading.value = true;
  try {
    const data = await api.auth.listarUsuarios();
    usuarios.value = data?.usuarios || [];
  } catch (err) {
    emit('notify', { message: `Error al cargar usuarios: ${err.message}`, type: 'danger' });
  } finally {
    loading.value = false;
  }
};

onMounted(fetchUsuarios);
</script>
