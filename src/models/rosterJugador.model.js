import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export const ROLES_EN_ROSTER_VALIDOS = ['Titular', 'Suplente'];

class RosterJugador extends Model {}

RosterJugador.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_roster: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'rosters',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    id_jugador: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'jugadores',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    rol_en_roster: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Titular',
      validate: {
        isIn: {
          args: [ROLES_EN_ROSTER_VALIDOS],
          msg: `El rol en el roster debe ser: ${ROLES_EN_ROSTER_VALIDOS.join(', ')}`
        }
      }
    }
  },
  {
    sequelize,
    modelName: 'RosterJugador',
    tableName: 'roster_jugadores',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['id_roster', 'id_jugador']
      }
    ]
  }
);

export default RosterJugador;
