import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { validarApiKey, verificarTokenYCsrf } from '../middlewares/auth.middleware.js';

const router = Router();

// Iniciar sesión con API Key en header + credenciales (Configura JWT HttpOnly + CSRF Cookie)
router.post('/login', validarApiKey, authController.login);

// Cerrar sesión y eliminar cookies
router.post('/logout', authController.logout);

// Verificar sesión activa
router.get('/verify', verificarTokenYCsrf, authController.verify);

export default router;
