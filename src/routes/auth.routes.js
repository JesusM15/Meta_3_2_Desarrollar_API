import { Router } from 'express';

import authController from '../controllers/auth.controller.js';

import { verificarTokenYCsrf, verificarToken } from '../middlewares/auth.middleware.js';



const router = Router();



// Iniciar sesión local con email + password

// POST /auth/login

router.post('/login', authController.login);



// Registrar nuevo usuario (rol Public)

// POST /auth/register

router.post('/register', authController.register);



// Cerrar sesión y eliminar cookies

// POST /auth/logout

router.post('/logout', verificarToken, (req, res, next) => {

  if (!req.headers['x-csrf-token'] || req.headers['x-csrf-token'] !== req.usuario.csrfToken) {

    return res.status(403).json({ error: 'Protección CSRF: token inválido' });

  }

  next();

}, authController.logout);



// Verificar sesión activa (requiere JWT válido de cualquier rol)

// GET /auth/verify

router.get('/verify', verificarToken, authController.verify);



// Listar usuarios registrados (solo Admin)

// GET /auth/usuarios — no requiere CSRF (es GET), pero sí JWT con rol Admin

router.get('/usuarios', verificarToken, authController.listarUsuarios);



export default router;
