import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export const ROLES_USUARIO = ['Admin', 'Usuario'];

class Usuario extends Model {}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    google_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre es obligatorio' }
      }
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'El correo electrónico debe ser válido' },
        notEmpty: { msg: 'El email no puede estar vacío' }
      }
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    rol: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Admin',
      validate: {
        isIn: {
          args: [ROLES_USUARIO],
          msg: `El rol debe ser uno de los siguientes: ${ROLES_USUARIO.join(', ')}`
        }
      }
    },
    ultimo_acceso: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: true
  }
);

export default Usuario;
