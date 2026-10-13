import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export const TIPOS_ROSTER_VALIDOS = ['Principal', 'Academy'];

class Roster extends Model {}

Roster.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre del roster no puede estar vacío' }
      }
    },
    juego: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'League of Legends'
    },
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Principal',
      validate: {
        isIn: {
          args: [TIPOS_ROSTER_VALIDOS],
          msg: `El tipo de roster debe ser: ${TIPOS_ROSTER_VALIDOS.join(', ')}`
        }
      }
    },
    temporada: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'La temporada no puede estar vacía' }
      }
    }
  },
  {
    sequelize,
    modelName: 'Roster',
    tableName: 'rosters',
    timestamps: true
  }
);

export default Roster;
