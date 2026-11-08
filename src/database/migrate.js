import { createRequire } from 'module';
import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const require = createRequire(import.meta.url);

const migrationFiles = [
  './migrations/20261012000001-create-jugadores.cjs',
  './migrations/20261012000002-create-rosters.cjs',
  './migrations/20261012000003-create-roster-jugador.cjs',
  './migrations/20261102000001-create-usuarios.cjs',
  './migrations/20261107000001-update-usuarios-meta42.cjs'
];

export async function runMigrations() {
  console.log('--- Iniciando migraciones de base de datos ---');
  try {
    await sequelize.authenticate();
    console.log(`Conexión a la base de datos (${sequelize.getDialect()}) exitosa.`);

    const queryInterface = sequelize.getQueryInterface();

    for (const file of migrationFiles) {
      console.log(`Ejecutando migración: ${file}`);
      try {
        const migration = require(file);
        await migration.up(queryInterface, Sequelize);
      } catch (migError) {
        if (
          migError.parent?.code === 'ER_TABLE_EXISTS_ERROR' ||
          migError.parent?.code === 'ER_DUP_KEYNAME' ||
          (migError.parent?.code === 'SQLITE_ERROR' && /already exists/i.test(migError.parent?.message || ''))
        ) {
          console.warn(`  ⚠️ Aviso en ${file}: ${migError.parent?.message || migError.message} (omitido)`);
        } else {
          throw migError;
        }
      }
    }

    console.log('✓ Todas las migraciones se ejecutaron con éxito.');
  } catch (error) {
    console.error('Error durante la ejecución de migraciones:', error);
    throw error;
  }
}

// Ejecutar si se invoca directamente desde CLI
if (process.argv[1]?.endsWith('migrate.js')) {
  runMigrations().then(() => sequelize.close());
}
