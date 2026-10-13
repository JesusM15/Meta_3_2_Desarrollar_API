import app from './src/app.js';
import sequelize from './src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log(`✓ Conexión establecida con la base de datos (${sequelize.getDialect()}).`);

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Servidor eSports API ejecutándose en el puerto ${PORT}`);
      console.log(`🌐 Base URL:      http://localhost:${PORT}/api/v1`);
      console.log(`📚 Swagger Docs:  http://localhost:${PORT}/api/v1/docs`);
      console.log(`📄 OpenAPI JSON:  http://localhost:${PORT}/api/v1/openapi.json`);
      console.log(`💻 Doc Estática:  http://localhost:${PORT}/docs-site/index.html`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('❌ Error fatal al conectar con la base de datos:', error.message);
    process.exit(1);
  }
}

startServer();
