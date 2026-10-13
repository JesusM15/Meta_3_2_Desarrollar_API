import sequelize from '../config/database.js';
import { runMigrations } from './migrate.js';
import { runSeeders } from './seed.js';

export async function resetDatabase() {
  console.log('--- Reiniciando base de datos ---');
  try {
    await sequelize.authenticate();
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.dropAllTables();
    console.log('✓ Tablas eliminadas correctamente.');

    await runMigrations();
    await runSeeders();
    console.log('✓ Base de datos reiniciada con éxito.');
  } catch (error) {
    console.error('Error al reiniciar base de datos:', error);
    process.exitCode = 1;
  }
}

if (process.argv[1]?.endsWith('reset.js')) {
  resetDatabase().then(() => sequelize.close());
}
