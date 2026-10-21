import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Generar un token CSRF criptográficamente seguro
 */
export const generarTokenCSRF = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Controlador de Autenticación con JWT, Cookies y Prevención de CSRF (Meta 3.4)
 */
class AuthController {
  /**
   * Iniciar sesión de Administrador
   * Requiere header: x-api-key
   * Body: { email, password }
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('El email y la contraseña son requeridos', 400);
      }

      const adminEmail = process.env.ADMIN_EMAIL || 'admin@esports.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (email.trim().toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
        throw new AppError('Credenciales de administrador inválidas', 401);
      }

      // Generar token CSRF único para esta sesión
      const csrfToken = generarTokenCSRF();

      // Construir payload seguro para el JWT
      const payload = {
        id: 1,
        email: email.trim().toLowerCase(),
        rol: 'Admin',
        apiKey: process.env.API_KEY || 'esports_api_key_admin_2026',
        csrfToken: csrfToken
      };

      // Firmar token JWT
      const tokenJWT = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'esports_jwt_secret_super_seguro_2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
      );

      const isProduction = process.env.NODE_ENV === 'production';
      const cookieMaxAge = parseInt(process.env.COOKIE_MAX_AGE, 10) || 7200000;

      // 1. Cookie HTTP-Only para el JWT (Inaccesible vía document.cookie -> Protegida contra XSS)
      res.cookie('jwt_token', tokenJWT, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: cookieMaxAge,
        path: '/'
      });

      // 2. Cookie CSRF para el cliente (Doble Cookie Pattern)
      res.cookie('csrf_token', csrfToken, {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: cookieMaxAge,
        path: '/'
      });

      return res.status(200).json({
        mensaje: 'Inicio de sesión exitoso como Administrador',
        usuario: {
          id: payload.id,
          email: payload.email,
          rol: payload.rol
        },
        csrfToken: csrfToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cerrar sesión y revocar cookies
   */
  async logout(req, res, next) {
    try {
      const isProduction = process.env.NODE_ENV === 'production';

      res.clearCookie('jwt_token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/'
      });

      res.clearCookie('csrf_token', {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'lax',
        path: '/'
      });

      return res.status(200).json({
        mensaje: 'Sesión cerrada correctamente'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar estado de autenticación actual
   */
  async verify(req, res, next) {
    try {
      return res.status(200).json({
        autenticado: true,
        usuario: {
          id: req.usuario.id,
          email: req.usuario.email,
          rol: req.usuario.rol
        },
        csrfToken: req.usuario.csrfToken || req.cookies?.csrf_token
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
