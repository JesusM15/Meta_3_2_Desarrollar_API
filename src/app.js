import express from 'express';

import cors from 'cors';

import path from 'path';

import { fileURLToPath } from 'url';

import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes.js';

import apiRouter from './routes/index.js';

import { setupSwagger } from './docs/swagger.js';

import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';



const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);



const app = express();



// CORS con soporte para Cookies HTTP-Only y credenciales

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

      return callback(new Error('Origen no permitido por CORS'));

    },

    credentials: true

  })

);

app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));



// Logging de peticiones con tiempo de respuesta

app.use((req, res, next) => {

  const start = Date.now();

  res.on('finish', () => {

    const duration = Date.now() - start;

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);

  });

  next();

});



// Servir documentación estática HTML

app.use('/docs-site', express.static(path.join(__dirname, '..', 'docs')));



// Configurar Swagger UI

setupSwagger(app);



// Ruta raíz

app.get('/', (req, res) => {

  res.status(200).json({

    nombre: 'API REST eSports Rosters — Meta 4.2',

    version: '2.0.0',

    descripcion: 'API con autenticación local JWT + CSRF, roles Admin y Public',

    documentacion: {

      swagger_ui: '/api/v1/docs',

      openapi_json: '/api/v1/openapi.json'

    },

    rutas_principales: {

      login: 'POST /auth/login',

      register: 'POST /auth/register',

      logout: 'POST /auth/logout',

      verify: 'GET /auth/verify',

      usuarios: 'GET /auth/usuarios (Admin)',

      jugadores: '/api/v1/jugadores',

      rosters: '/api/v1/rosters',

      health: '/api/v1/health'

    }

  });

});



// Montar rutas de autenticación

app.use('/auth', authRoutes);



// Montar API v1

app.use('/api/v1', apiRouter);



// Manejadores de error

app.use(notFoundHandler);

app.use(errorHandler);



export default app;
