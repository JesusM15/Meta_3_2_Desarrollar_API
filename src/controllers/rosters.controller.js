import rostersService from '../services/rosters.service.js';

class RostersController {
  async getAll(req, res, next) {
    try {
      const { tipo, temporada } = req.query;
      const rosters = await rostersService.getAll({ tipo, temporada });
      res.status(200).json(rosters);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const roster = await rostersService.getById(id);
      res.status(200).json(roster);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const nuevoRoster = await rostersService.create(req.body);
      res.status(201).json(nuevoRoster);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const rosterActualizado = await rostersService.update(id, req.body);
      res.status(200).json(rosterActualizado);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await rostersService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // --- Endpoints de Asignación ---

  async getJugadores(req, res, next) {
    try {
      const { id } = req.params;
      const jugadores = await rostersService.getJugadoresDeRoster(id);
      res.status(200).json(jugadores);
    } catch (error) {
      next(error);
    }
  }

  async assignJugador(req, res, next) {
    try {
      const { id } = req.params;
      const asignacion = await rostersService.assignJugador(id, req.body);
      res.status(201).json(asignacion);
    } catch (error) {
      next(error);
    }
  }

  async updateJugadorRol(req, res, next) {
    try {
      const { id, id_jugador } = req.params;
      const resultado = await rostersService.updateJugadorRol(id, id_jugador, req.body);
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  async removeJugador(req, res, next) {
    try {
      const { id, id_jugador } = req.params;
      await rostersService.removeJugador(id, id_jugador);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new RostersController();
