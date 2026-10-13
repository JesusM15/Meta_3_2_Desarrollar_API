import { ROLES_VALIDOS, ESTADOS_VALIDOS, TIPOS_ROSTER_VALIDOS, sequelize } from '../models/index.js';

class AuxiliaresController {
  getRoles(req, res) {
    res.status(200).json(ROLES_VALIDOS);
  }

  getEstados(req, res) {
    res.status(200).json(ESTADOS_VALIDOS);
  }

  getTiposRoster(req, res) {
    res.status(200).json(TIPOS_ROSTER_VALIDOS);
  }

  async getHealth(req, res) {
    let dbStatus = 'disconnected';
    try {
      await sequelize.authenticate();
      dbStatus = 'connected';
    } catch (e) {
      dbStatus = 'error: ' + e.message;
    }

    res.status(200).json({
      status: 'ok',
      service: 'esports-rosters-api',
      uptime_seconds: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      dialect: sequelize.getDialect()
    });
  }
}

export default new AuxiliaresController();
