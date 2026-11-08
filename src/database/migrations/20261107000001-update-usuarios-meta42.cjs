'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('usuarios').catch(() => null);
    if (!tableDescription) {
      console.log('  -> Tabla usuarios no existe, omitiendo migración.');
      return;
    }

    // Agregar campo password_hash si no existe
    if (!tableDescription.password_hash) {
      await queryInterface.addColumn('usuarios', 'password_hash', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'email'
      });
      console.log('  -> Columna password_hash agregada a usuarios.');
    }

    // Si existe google_id (de Meta 4.1), eliminarlo
    if (tableDescription.google_id) {
      await queryInterface.removeColumn('usuarios', 'google_id');
      console.log('  -> Columna google_id eliminada de usuarios.');
    }

    // Si existe avatar, eliminarlo
    if (tableDescription.avatar) {
      await queryInterface.removeColumn('usuarios', 'avatar');
      console.log('  -> Columna avatar eliminada de usuarios.');
    }

    // Cambiar default de rol a 'Public' (para MySQL; en SQLite ignoramos el ALTER)
    try {
      await queryInterface.changeColumn('usuarios', 'rol', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Public'
      });
      console.log('  -> Default de rol cambiado a Public.');
    } catch (e) {
      console.log('  -> No se pudo cambiar default de rol (posiblemente SQLite):', e.message);
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('usuarios').catch(() => null);
    if (!tableDescription) return;

    if (tableDescription.password_hash) {
      await queryInterface.removeColumn('usuarios', 'password_hash');
    }
    await queryInterface.addColumn('usuarios', 'google_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true
    });
    await queryInterface.addColumn('usuarios', 'avatar', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  }
};
