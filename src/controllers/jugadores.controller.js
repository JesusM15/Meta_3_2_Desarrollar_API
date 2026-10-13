import jugadoresService from '../services/jugadores.service.js';

class JugadoresController {
  async getAll(req, res, next) {
    try {
      const { rol, estado, search } = req.query;
      const jugadores = await jugadoresService.getAll({ rol, estado, search });
      res.status(200).json(jugadores);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const jugador = await jugadoresService.getById(id);
      res.status(200).json(jugador);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const nuevoJugador = await jugadoresService.create(req.body);
      res.status(201).json(nuevoJugador);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const jugadorActualizado = await jugadoresService.update(id, req.body);
      res.status(200).json(jugadorActualizado);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await jugadoresService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new JugadoresController();
