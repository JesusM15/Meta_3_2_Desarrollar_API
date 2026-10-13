'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Insertar Jugadores
    await queryInterface.bulkInsert('jugadores', [
      {
        nickname: 'Faker',
        nombre_real: 'Lee Sang-hyeok',
        pais: 'Corea del Sur',
        rol: 'Mid',
        estado: 'activo',
        created_at: now,
        updated_at: now
      },
      {
        nickname: 'Zeus',
        nombre_real: 'Choi Woo-je',
        pais: 'Corea del Sur',
        rol: 'Top',
        estado: 'activo',
        created_at: now,
        updated_at: now
      },
      {
        nickname: 'Oner',
        nombre_real: 'Mun Hyeon-jun',
        pais: 'Corea del Sur',
        rol: 'Jungle',
        estado: 'activo',
        created_at: now,
        updated_at: now
      },
      {
        nickname: 'Gumayusi',
        nombre_real: 'Lee Min-hyeong',
        pais: 'Corea del Sur',
        rol: 'ADC',
        estado: 'activo',
        created_at: now,
        updated_at: now
      },
      {
        nickname: 'Keria',
        nombre_real: 'Ryu Min-seok',
        pais: 'Corea del Sur',
        rol: 'Support',
        estado: 'activo',
        created_at: now,
        updated_at: now
      },
      {
        nickname: 'Caps',
        nombre_real: 'Rasmus Winther',
        pais: 'Dinamarca',
        rol: 'Mid',
        estado: 'activo',
        created_at: now,
        updated_at: now
      },
      {
        nickname: 'BrokenBlade',
        nombre_real: 'Sergen Çelik',
        pais: 'Alemania',
        rol: 'Top',
        estado: 'activo',
        created_at: now,
        updated_at: now
      },
      {
        nickname: 'Jankos',
        nombre_real: 'Marcin Jankowski',
        pais: 'Polonia',
        rol: 'Jungle',
        estado: 'inactivo',
        created_at: now,
        updated_at: now
      }
    ]);

    // 2. Insertar Rosters
    await queryInterface.bulkInsert('rosters', [
      {
        nombre: 'T1 Principal',
        juego: 'League of Legends',
        tipo: 'Principal',
        temporada: '2026',
        created_at: now,
        updated_at: now
      },
      {
        nombre: 'G2 Academy',
        juego: 'League of Legends',
        tipo: 'Academy',
        temporada: '2026',
        created_at: now,
        updated_at: now
      }
    ]);

    // 3. Asignaciones iniciales
    await queryInterface.bulkInsert('roster_jugadores', [
      { id_roster: 1, id_jugador: 1, rol_en_roster: 'Titular', created_at: now, updated_at: now },
      { id_roster: 1, id_jugador: 2, rol_en_roster: 'Titular', created_at: now, updated_at: now },
      { id_roster: 1, id_jugador: 3, rol_en_roster: 'Titular', created_at: now, updated_at: now },
      { id_roster: 1, id_jugador: 4, rol_en_roster: 'Titular', created_at: now, updated_at: now },
      { id_roster: 1, id_jugador: 5, rol_en_roster: 'Titular', created_at: now, updated_at: now },
      { id_roster: 2, id_jugador: 6, rol_en_roster: 'Titular', created_at: now, updated_at: now },
      { id_roster: 2, id_jugador: 7, rol_en_roster: 'Titular', created_at: now, updated_at: now },
      { id_roster: 2, id_jugador: 8, rol_en_roster: 'Suplente', created_at: now, updated_at: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roster_jugadores', null, {});
    await queryInterface.bulkDelete('rosters', null, {});
    await queryInterface.bulkDelete('jugadores', null, {});
  }
};
