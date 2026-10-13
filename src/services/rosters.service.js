import { Roster, Jugador, RosterJugador, TIPOS_ROSTER_VALIDOS, ROLES_EN_ROSTER_VALIDOS } from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';

class RostersService {
  async getAll({ tipo, temporada }) {
    const where = {};

    if (tipo) {
      if (!TIPOS_ROSTER_VALIDOS.includes(tipo)) {
        throw new AppError(`Tipo de roster inválido '${tipo}'. Válidos: ${TIPOS_ROSTER_VALIDOS.join(', ')}`, 400);
      }
      where.tipo = tipo;
    }

    if (temporada) {
      where.temporada = temporada.trim();
    }

    const rosters = await Roster.findAll({
      where,
      include: [
        {
          model: RosterJugador,
          as: 'asignaciones',
          attributes: ['id']
        }
      ],
      order: [['id', 'ASC']]
    });

    // Formatear salida con cantidad_jugadores
    return rosters.map((r) => {
      const plain = r.toJSON();
      const cantidad = plain.asignaciones ? plain.asignaciones.length : 0;
      delete plain.asignaciones;
      return {
        id: plain.id,
        nombre: plain.nombre,
        juego: plain.juego,
        tipo: plain.tipo,
        temporada: plain.temporada,
        cantidad_jugadores: cantidad
      };
    });
  }

  async getById(id) {
    const roster = await Roster.findByPk(id, {
      include: [
        {
          model: RosterJugador,
          as: 'asignaciones',
          include: [
            {
              model: Jugador,
              as: 'jugador',
              attributes: ['id', 'nickname', 'rol', 'pais', 'estado']
            }
          ]
        }
      ]
    });

    if (!roster) {
      throw new AppError(`Roster con ID ${id} no encontrado`, 404);
    }

    const plain = roster.toJSON();
    const jugadoresFormateados = (plain.asignaciones || [])
      .filter((a) => a.jugador)
      .map((a) => ({
        id: a.jugador.id,
        nickname: a.jugador.nickname,
        rol: a.jugador.rol,
        rol_en_roster: a.rol_en_roster,
        pais: a.jugador.pais,
        estado: a.jugador.estado
      }));

    return {
      id: plain.id,
      nombre: plain.nombre,
      juego: plain.juego,
      tipo: plain.tipo,
      temporada: plain.temporada,
      jugadores: jugadoresFormateados
    };
  }

  async create({ nombre, juego, tipo, temporada }) {
    if (!nombre || nombre.trim() === '') {
      throw new AppError('El nombre del roster es obligatorio', 400);
    }

    if (!temporada || temporada.toString().trim() === '') {
      throw new AppError('La temporada es obligatoria (ej. 2026)', 400);
    }

    const tipoFinal = tipo || 'Principal';
    if (!TIPOS_ROSTER_VALIDOS.includes(tipoFinal)) {
      throw new AppError(`Tipo de roster inválido '${tipoFinal}'. Válidos: ${TIPOS_ROSTER_VALIDOS.join(', ')}`, 400);
    }

    const nuevoRoster = await Roster.create({
      nombre: nombre.trim(),
      juego: juego ? juego.trim() : 'League of Legends',
      tipo: tipoFinal,
      temporada: temporada.toString().trim()
    });

    return nuevoRoster;
  }

  async update(id, data) {
    const roster = await Roster.findByPk(id);
    if (!roster) {
      throw new AppError(`Roster con ID ${id} no encontrado`, 404);
    }

    const { nombre, juego, tipo, temporada } = data;

    if (nombre !== undefined) {
      if (!nombre || nombre.trim() === '') {
        throw new AppError('El nombre del roster no puede estar vacío', 400);
      }
      roster.nombre = nombre.trim();
    }

    if (juego !== undefined) {
      roster.juego = juego ? juego.trim() : 'League of Legends';
    }

    if (tipo !== undefined) {
      if (!TIPOS_ROSTER_VALIDOS.includes(tipo)) {
        throw new AppError(`Tipo de roster inválido '${tipo}'. Válidos: ${TIPOS_ROSTER_VALIDOS.join(', ')}`, 400);
      }
      roster.tipo = tipo;
    }

    if (temporada !== undefined) {
      if (!temporada || temporada.toString().trim() === '') {
        throw new AppError('La temporada no puede estar vacía', 400);
      }
      roster.temporada = temporada.toString().trim();
    }

    await roster.save();
    return roster;
  }

  async delete(id) {
    const roster = await Roster.findByPk(id);
    if (!roster) {
      throw new AppError(`Roster con ID ${id} no encontrado`, 404);
    }

    // RN-05: Al eliminar un roster, los jugadores permanecen en el sistema.
    // Solo se eliminan las asignaciones en cascada
    await roster.destroy();
    return true;
  }

  // --- Módulo Asignación ---

  async getJugadoresDeRoster(rosterId) {
    const roster = await Roster.findByPk(rosterId);
    if (!roster) {
      throw new AppError(`Roster con ID ${rosterId} no encontrado`, 404);
    }

    const asignaciones = await RosterJugador.findAll({
      where: { id_roster: rosterId },
      include: [
        {
          model: Jugador,
          as: 'jugador',
          attributes: ['id', 'nickname', 'nombre_real', 'pais', 'rol', 'estado']
        }
      ]
    });

    return asignaciones.map((a) => ({
      id: a.jugador.id,
      nickname: a.jugador.nickname,
      nombre_real: a.jugador.nombre_real,
      pais: a.jugador.pais,
      rol: a.jugador.rol,
      estado: a.jugador.estado,
      rol_en_roster: a.rol_en_roster
    }));
  }

  async assignJugador(rosterId, { id_jugador, rol_en_roster }) {
    if (!id_jugador) {
      throw new AppError('El campo id_jugador es obligatorio', 400);
    }

    const rolEnRoster = rol_en_roster || 'Titular';
    if (!ROLES_EN_ROSTER_VALIDOS.includes(rolEnRoster)) {
      throw new AppError(`Rol en roster inválido '${rolEnRoster}'. Opciones: ${ROLES_EN_ROSTER_VALIDOS.join(', ')}`, 400);
    }

    // 1. Validar existencia de Roster
    const roster = await Roster.findByPk(rosterId);
    if (!roster) {
      throw new AppError(`Roster con ID ${rosterId} no encontrado`, 404);
    }

    // 2. Validar existencia de Jugador
    const jugador = await Jugador.findByPk(id_jugador);
    if (!jugador) {
      throw new AppError(`Jugador con ID ${id_jugador} no encontrado`, 404);
    }

    // 3. Validar si ya está asignado al roster
    const asignacionExistente = await RosterJugador.findOne({
      where: {
        id_roster: rosterId,
        id_jugador: id_jugador
      }
    });

    if (asignacionExistente) {
      throw new AppError(`El jugador '${jugador.nickname}' ya está asignado a este roster`, 409);
    }

    // 4. Si se asigna como Titular, aplicar reglas de negocio
    if (rolEnRoster === 'Titular') {
      const titularesActuales = await RosterJugador.findAll({
        where: {
          id_roster: rosterId,
          rol_en_roster: 'Titular'
        },
        include: [{ model: Jugador, as: 'jugador' }]
      });

      // RN-02: Máximo 5 titulares por roster
      if (titularesActuales.length >= 5) {
        throw new AppError('Un roster puede tener como máximo 5 titulares (RN-02)', 409);
      }

      // RN-03: No puede haber dos titulares con el mismo rol en un roster
      const mismoRol = titularesActuales.find(
        (t) => t.jugador && t.jugador.rol === jugador.rol
      );
      if (mismoRol) {
        throw new AppError(
          `No puede haber dos titulares con el mismo rol en un roster. El rol '${jugador.rol}' ya está cubierto por el titular '${mismoRol.jugador.nickname}' (RN-03)`,
          409
        );
      }
    }

    // 5. Crear la asignación
    const nuevaAsignacion = await RosterJugador.create({
      id_roster: Number(rosterId),
      id_jugador: Number(id_jugador),
      rol_en_roster: rolEnRoster
    });

    return {
      id: nuevaAsignacion.id,
      id_roster: nuevaAsignacion.id_roster,
      id_jugador: nuevaAsignacion.id_jugador,
      rol_en_roster: nuevaAsignacion.rol_en_roster,
      jugador: {
        id: jugador.id,
        nickname: jugador.nickname,
        rol: jugador.rol
      }
    };
  }

  async updateJugadorRol(rosterId, jugadorId, { rol_en_roster }) {
    if (!rol_en_roster) {
      throw new AppError('El campo rol_en_roster es obligatorio', 400);
    }

    if (!ROLES_EN_ROSTER_VALIDOS.includes(rol_en_roster)) {
      throw new AppError(`Rol en roster inválido '${rol_en_roster}'. Opciones: ${ROLES_EN_ROSTER_VALIDOS.join(', ')}`, 400);
    }

    const roster = await Roster.findByPk(rosterId);
    if (!roster) {
      throw new AppError(`Roster con ID ${rosterId} no encontrado`, 404);
    }

    const asignacion = await RosterJugador.findOne({
      where: {
        id_roster: rosterId,
        id_jugador: jugadorId
      },
      include: [{ model: Jugador, as: 'jugador' }]
    });

    if (!asignacion) {
      throw new AppError(`El jugador con ID ${jugadorId} no pertenece al roster con ID ${rosterId}`, 404);
    }

    // Si se cambia a Titular y antes era Suplente
    if (rol_en_roster === 'Titular' && asignacion.rol_en_roster !== 'Titular') {
      const otrosTitulares = await RosterJugador.findAll({
        where: {
          id_roster: rosterId,
          rol_en_roster: 'Titular'
        },
        include: [{ model: Jugador, as: 'jugador' }]
      });

      // RN-02: Máximo 5 titulares
      if (otrosTitulares.length >= 5) {
        throw new AppError('Un roster puede tener como máximo 5 titulares (RN-02)', 409);
      }

      // RN-03: No puede haber dos titulares con el mismo rol
      const mismoRol = otrosTitulares.find(
        (t) => t.jugador && t.jugador.rol === asignacion.jugador.rol
      );
      if (mismoRol) {
        throw new AppError(
          `No puede haber dos titulares con el mismo rol en un roster. El rol '${asignacion.jugador.rol}' ya está cubierto por '${mismoRol.jugador.nickname}' (RN-03)`,
          409
        );
      }
    }

    asignacion.rol_en_roster = rol_en_roster;
    await asignacion.save();

    return {
      id_roster: Number(rosterId),
      id_jugador: Number(jugadorId),
      rol_en_roster: asignacion.rol_en_roster
    };
  }

  async removeJugador(rosterId, jugadorId) {
    const roster = await Roster.findByPk(rosterId);
    if (!roster) {
      throw new AppError(`Roster con ID ${rosterId} no encontrado`, 404);
    }

    const asignacion = await RosterJugador.findOne({
      where: {
        id_roster: rosterId,
        id_jugador: jugadorId
      }
    });

    if (!asignacion) {
      throw new AppError(`El jugador con ID ${jugadorId} no está asignado al roster con ID ${rosterId}`, 404);
    }

    await asignacion.destroy();
    return true;
  }
}

export default new RostersService();
