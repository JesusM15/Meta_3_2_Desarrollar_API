'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roster_jugadores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_roster: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'rosters',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_jugador: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'jugadores',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rol_en_roster: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Titular'
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

    await queryInterface.addIndex('roster_jugadores', ['id_roster', 'id_jugador'], {
      unique: true,
      name: 'unique_roster_jugador'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('roster_jugadores');
  }
};
