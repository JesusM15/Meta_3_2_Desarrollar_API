import sequelize from '../config/database.js';
import Jugador, { ROLES_VALIDOS, ESTADOS_VALIDOS } from './jugador.model.js';
import Roster, { TIPOS_ROSTER_VALIDOS } from './roster.model.js';
import RosterJugador, { ROLES_EN_ROSTER_VALIDOS } from './rosterJugador.model.js';

// Relaciones Many-to-Many entre Roster y Jugador
Roster.belongsToMany(Jugador, {
  through: RosterJugador,
  foreignKey: 'id_roster',
  otherKey: 'id_jugador',
  as: 'jugadores'
});

Jugador.belongsToMany(Roster, {
  through: RosterJugador,
  foreignKey: 'id_jugador',
  otherKey: 'id_roster',
  as: 'rosters'
});

// Relaciones directas con la tabla intermedia
Roster.hasMany(RosterJugador, {
  foreignKey: 'id_roster',
  as: 'asignaciones',
  onDelete: 'CASCADE'
});
RosterJugador.belongsTo(Roster, {
  foreignKey: 'id_roster',
  as: 'roster'
});

Jugador.hasMany(RosterJugador, {
  foreignKey: 'id_jugador',
  as: 'asignaciones',
  onDelete: 'CASCADE'
});
RosterJugador.belongsTo(Jugador, {
  foreignKey: 'id_jugador',
  as: 'jugador'
});

export {
  sequelize,
  Jugador,
  Roster,
  RosterJugador,
  ROLES_VALIDOS,
  ESTADOS_VALIDOS,
  TIPOS_ROSTER_VALIDOS,
  ROLES_EN_ROSTER_VALIDOS
};

export default {
  sequelize,
  Jugador,
  Roster,
  RosterJugador
};
