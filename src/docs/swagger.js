import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openApiSpecPath = path.join(__dirname, 'openapi.json');
const openApiSpec = JSON.parse(fs.readFileSync(openApiSpecPath, 'utf-8'));

export function setupSwagger(app) {
  // Servir especificación en formato JSON crudo
  app.get('/api/v1/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiSpec);
  });

  // Opciones personalizadas para el Swagger UI con estilo moderno y selector de operaciones
  const options = {
    customCss: '.swagger-ui .topbar { background-color: #0f172a; } .swagger-ui .topbar .download-url-wrapper { display: none; }',
    customSiteTitle: 'eSports Rosters API Docs - Meta 3.2'
  };

  // Montar Swagger UI en /api/v1/docs y /docs
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, options));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, options));
}

export { openApiSpec };
