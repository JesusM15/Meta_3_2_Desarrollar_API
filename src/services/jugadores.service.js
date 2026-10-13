import { Op } from 'sequelize';
import { Jugador, RosterJugador, ROLES_VALIDOS, ESTADOS_VALIDOS } from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';

class JugadoresService {
  async getAll({ rol, estado, search }) {
    const where = {};

    if (rol) {
      if (!ROLES_VALIDOS.includes(rol)) {
        throw new AppError(`Rol inválido '${rol}'. Roles válidos: ${ROLES_VALIDOS.join(', ')}`, 400);
      }
      where.rol = rol;
    }

    if (estado) {
      if (!ESTADOS_VALIDOS.includes(estado)) {
        throw new AppError(`Estado inválido '${estado}'. Estados válidos: ${ESTADOS_VALIDOS.join(', ')}`, 400);
      }
      where.estado = estado;
    }

    if (search && search.trim() !== '') {
      where.nickname = { [Op.like]: `%${search.trim()}%` };
    }

    return await Jugador.findAll({
      where,
      attributes: ['id', 'nickname', 'nombre_real', 'pais', 'rol', 'estado'],
      order: [['id', 'ASC']]
    });
  }

  async getById(id) {
    const jugador = await Jugador.findByPk(id, {
      attributes: ['id', 'nickname', 'nombre_real', 'pais', 'rol', 'estado', 'createdAt', 'updatedAt']
    });

    if (!jugador) {
      throw new AppError(`Jugador con ID ${id} no encontrado`, 404);
    }

    return jugador;
  }

  async create({ nickname, nombre_real, pais, rol, estado }) {
    if (!nickname || nickname.trim() === '') {
      throw new AppError('El nickname es obligatorio', 400);
    }

    if (!rol || rol.trim() === '') {
      throw new AppError(`El rol es obligatorio. Opciones válidas: ${ROLES_VALIDOS.join(', ')}`, 400);
    }

    if (!ROLES_VALIDOS.includes(rol)) {
      throw new AppError(`Rol inválido '${rol}'. Debe ser uno de: ${ROLES_VALIDOS.join(', ')}`, 400);
    }

    const estadoFinal = estado || 'activo';
    if (!ESTADOS_VALIDOS.includes(estadoFinal)) {
      throw new AppError(`Estado inválido '${estadoFinal}'. Debe ser: ${ESTADOS_VALIDOS.join(', ')}`, 400);
    }

    // RN-01: El nickname de un jugador debe ser único
    const existeNickname = await Jugador.findOne({ where: { nickname: nickname.trim() } });
    if (existeNickname) {
      throw new AppError(`El nickname '${nickname.trim()}' ya está registrado (RN-01)`, 409);
    }

    const nuevoJugador = await Jugador.create({
      nickname: nickname.trim(),
      nombre_real: nombre_real ? nombre_real.trim() : null,
      pais: pais ? pais.trim() : null,
      rol,
      estado: estadoFinal
    });

    return nuevoJugador;
  }

  async update(id, data) {
    const jugador = await Jugador.findByPk(id);
    if (!jugador) {
      throw new AppError(`Jugador con ID ${id} no encontrado`, 404);
    }

    const { nickname, nombre_real, pais, rol, estado } = data;

    if (nickname !== undefined) {
      if (!nickname || nickname.trim() === '') {
        throw new AppError('El nickname no puede estar vacío', 400);
      }
      // RN-01: Nickname único al actualizar
      const existente = await Jugador.findOne({
        where: {
          nickname: nickname.trim(),
          id: { [Op.ne]: id }
        }
      });
      if (existente) {
        throw new AppError(`El nickname '${nickname.trim()}' ya está en uso por otro jugador (RN-01)`, 409);
      }
      jugador.nickname = nickname.trim();
    }

    if (nombre_real !== undefined) {
      jugador.nombre_real = nombre_real ? nombre_real.trim() : null;
    }

    if (pais !== undefined) {
      jugador.pais = pais ? pais.trim() : null;
    }

    if (rol !== undefined) {
      if (!ROLES_VALIDOS.includes(rol)) {
        throw new AppError(`Rol inválido '${rol}'. Debe ser: ${ROLES_VALIDOS.join(', ')}`, 400);
      }
      jugador.rol = rol;
    }

    if (estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(estado)) {
        throw new AppError(`Estado inválido '${estado}'. Debe ser: ${ESTADOS_VALIDOS.join(', ')}`, 400);
      }
      jugador.estado = estado;
    }

    await jugador.save();
    return jugador;
  }

  async delete(id) {
    const jugador = await Jugador.findByPk(id);
    if (!jugador) {
      throw new AppError(`Jugador con ID ${id} no encontrado`, 404);
    }

    await jugador.destroy();
    return true;
  }
}

export default new JugadoresService();
