import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';
import { setupSwagger } from './docs/swagger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares base con soporte para Cookies HTTP-Only y CORS con credenciales
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de medición de tiempo de respuesta (RNF-03: < 0.5s) y logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Servir documentación estática HTML desde /docs
app.use('/docs-site', express.static(path.join(__dirname, '..', 'docs')));

// Configurar Swagger UI en /api/v1/docs y /docs
setupSwagger(app);

// Ruta raíz con resumen y accesos directos
app.get('/', (req, res) => {
  res.status(200).json({
    nombre: 'API REST: Perfiles de Jugadores y Rosters (Meta 3.2)',
    version: '1.0.0',
    descripcion: 'API para gestión de jugadores y alineaciones de eSports en League of Legends',
    documentacion: {
      swagger_ui: '/api/v1/docs',
      openapi_json: '/api/v1/openapi.json',
      doc_estatica: '/docs-site/index.html'
    },
    rutas_principales: {
      jugadores: '/api/v1/jugadores',
      rosters: '/api/v1/rosters',
      roles: '/api/v1/roles',
      estados: '/api/v1/estados',
      tipos_roster: '/api/v1/tipos-roster',
      health: '/api/v1/health'
    }
  });
});

// Montar endpoints en la versión 1 de la API
app.use('/api/v1', apiRouter);

// Manejador de 404 para rutas inexistentes
app.use(notFoundHandler);

// Manejador centralizado de errores
app.use(errorHandler);

export default app;
