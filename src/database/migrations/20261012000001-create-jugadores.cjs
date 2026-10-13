'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jugadores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nickname: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      nombre_real: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      pais: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      rol: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      estado: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'activo'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('jugadores');
  }
};
