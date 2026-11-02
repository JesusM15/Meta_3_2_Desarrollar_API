'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const tableNames = Array.isArray(tables) ? tables.map(t => (typeof t === 'object' ? Object.values(t)[0] : t)) : [];
    if (tableNames.includes('usuarios')) {
      console.log('  -> Tabla usuarios ya existe, omitiendo creación.');
      return;
    }
    await queryInterface.createTable('usuarios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      google_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      rol: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Admin'
      },
      ultimo_acceso: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.dropTable('usuarios');
  }
};
