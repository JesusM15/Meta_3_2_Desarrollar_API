import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { validarApiKey, verificarTokenYCsrf } from '../middlewares/auth.middleware.js';

const router = Router();

// Iniciar flujo de Google OAuth 2.0 (Meta 4.1)
router.get('/google/login', authController.googleLogin);

// Callback de Google OAuth 2.0 (Meta 4.1)
router.get('/google/callback', authController.googleCallback);

// Iniciar sesión con API Key en header + credenciales (Configura JWT HttpOnly + CSRF Cookie)
router.post('/login', validarApiKey, authController.login);

// Cerrar sesión y eliminar cookies
router.post('/logout', authController.logout);

// Verificar sesión activa
router.get('/verify', verificarTokenYCsrf, authController.verify);

// Obtener tabla de usuarios registrados en el backend
router.get('/usuarios', authController.listarUsuarios);

export default router;
