import { createRequire } from 'module';
import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const require = createRequire(import.meta.url);

const seederFiles = [
  './seeders/20261012000001-demo-data.cjs'
];

export async function runSeeders() {
  console.log('--- Insertando datos iniciales (Seeders) ---');
  try {
    await sequelize.authenticate();
    const queryInterface = sequelize.getQueryInterface();

    for (const file of seederFiles) {
      console.log(`Ejecutando seeder: ${file}`);
      const seeder = require(file);
      await seeder.up(queryInterface, Sequelize);
    }

    console.log('✓ Datos iniciales insertados con éxito.');
  } catch (error) {
    console.error('Error durante la inserción de seeders:', error);
    process.exitCode = 1;
  }
}

if (process.argv[1]?.endsWith('seed.js')) {
  runSeeders().then(() => sequelize.close());
}
