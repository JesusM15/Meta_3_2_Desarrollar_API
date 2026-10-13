import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export const ROLES_VALIDOS = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
export const ESTADOS_VALIDOS = ['activo', 'inactivo'];

class Jugador extends Model {}

Jugador.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El nickname no puede estar vacío' }
      }
    },
    nombre_real: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    pais: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    rol: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: {
          args: [ROLES_VALIDOS],
          msg: `El rol debe ser uno de los siguientes: ${ROLES_VALIDOS.join(', ')}`
        }
      }
    },
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'activo',
      validate: {
        isIn: {
          args: [ESTADOS_VALIDOS],
          msg: `El estado debe ser: ${ESTADOS_VALIDOS.join(', ')}`
        }
      }
    }
  },
  {
    sequelize,
    modelName: 'Jugador',
    tableName: 'jugadores',
    timestamps: true
  }
);

export default Jugador;
