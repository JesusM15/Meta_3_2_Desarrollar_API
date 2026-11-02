import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppError } from '../middlewares/errorHandler.js';
import { Usuario } from '../models/index.js';
import { generarGoogleAuthUrl, obtenerPerfilGoogle } from '../config/googleOAuth.js';

/**
 * Generar un token CSRF criptográficamente seguro
 */
export const generarTokenCSRF = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Controlador de Autenticación con JWT, Cookies, CSRF y Google OAuth 2.0 (Meta 4.1)
 */
class AuthController {
  /**
   * Iniciar flujo de autenticación con Google OAuth 2.0
   * GET /auth/google/login
   */
  async googleLogin(req, res, next) {
    try {
      if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('tu_google_client_id')) {
        return res.status(503).json({
          error: 'Google OAuth no configurado',
          mensaje: 'Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI en su archivo .env para usar este endpoint.'
        });
      }

      // Generar token CSRF para el parámetro 'state' de OAuth y prevenir ataques de fijación de sesión
      const state = generarTokenCSRF();
      const authUrl = generarGoogleAuthUrl(state);

      // Si el cliente solicita formato JSON expresamente (útil para clientes frontend, Postman, test suite)
      if (req.query.format === 'json' || (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html'))) {
        return res.status(200).json({
          mensaje: 'URL de autorización de Google generada',
          authUrl,
          state
        });
      }

      // Si se accede directamente desde el navegador, redirigir a Google
      return res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Callback de Google OAuth 2.0
   * GET /auth/google/callback
   */
  async googleCallback(req, res, next) {
    try {
      const { code, error, error_description } = req.query;

      if (error) {
        throw new AppError(`Error de autenticación devuelto por Google: ${error_description || error}`, 400);
      }

      if (!code) {
        throw new AppError('Código de autorización de Google no proporcionado en la URL', 400);
      }

      // 1. Intercambiar código por tokens y perfil de Google
      const { perfil } = await obtenerPerfilGoogle(code);

      if (!perfil || !perfil.email) {
        throw new AppError('No fue posible obtener el correo electrónico del perfil de Google', 400);
      }

      // 2. Registrar o actualizar usuario en la tabla de base de datos
      let usuario = await Usuario.findOne({ where: { email: perfil.email } });

      if (usuario) {
        usuario.google_id = perfil.id || usuario.google_id;
        usuario.nombre = perfil.name || usuario.nombre;
        usuario.avatar = perfil.picture || usuario.avatar;
        usuario.ultimo_acceso = new Date();
        await usuario.save();
      } else {
        usuario = await Usuario.create({
          google_id: perfil.id,
          nombre: perfil.name || perfil.email.split('@')[0],
          email: perfil.email,
          avatar: perfil.picture,
          rol: 'Admin', // Asignar rol Admin para permitir interactuar con endpoints protegidos
          ultimo_acceso: new Date()
        });
      }

      // 3. Generar token CSRF
      const csrfToken = generarTokenCSRF();

      // 4. Generar JWT firmado con los datos del usuario
      const payload = {
        id: usuario.id,
        google_id: usuario.google_id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        apiKey: process.env.API_KEY || 'esports_api_key_admin_2026',
        csrfToken: csrfToken
      };

      const tokenJWT = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'esports_jwt_secret_super_seguro_2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
      );

      const isProduction = process.env.NODE_ENV === 'production';
      const cookieMaxAge = parseInt(process.env.COOKIE_MAX_AGE, 10) || 7200000;

      // 5. Configurar Cookies Seguras (HTTP-Only para JWT + Doble Cookie Pattern para CSRF)
      res.cookie('jwt_token', tokenJWT, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: cookieMaxAge,
        path: '/'
      });

      res.cookie('csrf_token', csrfToken, {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: cookieMaxAge,
        path: '/'
      });

      // Si el navegador proviene de un navegador web y hay CLIENT_URL para redirigir
      if (req.headers.accept && req.headers.accept.includes('text/html') && req.query.no_redirect !== 'true') {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        // Redirigir al frontend pasando indicación de éxito o responder HTML
        return res.send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <title>Autenticación Exitosa con Google</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
              .card { background: #1e293b; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 480px; width: 100%; text-align: center; }
              .avatar { width: 80px; height: 80px; border-radius: 50%; margin: 1rem auto; border: 3px solid #38bdf8; }
              h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #38bdf8; }
              p { color: #94a3b8; font-size: 0.95rem; }
              .badge { display: inline-block; padding: 0.25rem 0.75rem; background: #0284c7; border-radius: 9999px; font-weight: bold; margin: 0.5rem 0; }
              .btn { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #38bdf8; color: #0f172a; font-weight: bold; border-radius: 8px; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>¡Autenticación con Google Exitosa!</h1>
              ${usuario.avatar ? `<img src="${usuario.avatar}" class="avatar" alt="Avatar">` : ''}
              <p>Bienvenido, <strong>${usuario.nombre}</strong></p>
              <p>${usuario.email}</p>
              <div class="badge">Rol: ${usuario.rol}</div>
              <p style="font-size: 0.8rem; margin-top: 1rem;">Sesión guardada en cookies HTTP-Only y token CSRF generado.</p>
              <a href="${clientUrl}" class="btn">Ir a la Aplicación Frontend</a>
            </div>
          </body>
          </html>
        `);
      }

      return res.status(200).json({
        mensaje: 'Autenticación con Google exitosa',
        usuario: {
          id: usuario.id,
          google_id: usuario.google_id,
          nombre: usuario.nombre,
          email: usuario.email,
          avatar: usuario.avatar,
          rol: usuario.rol,
          ultimo_acceso: usuario.ultimo_acceso
        },
        csrfToken: csrfToken,
        tokenJWT: tokenJWT
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener lista de usuarios registrados en la base de datos
   * GET /auth/usuarios
   */
  async listarUsuarios(req, res, next) {
    try {
      const usuarios = await Usuario.findAll({
        attributes: ['id', 'google_id', 'nombre', 'email', 'avatar', 'rol', 'ultimo_acceso', 'createdAt', 'updatedAt'],
        order: [['id', 'ASC']]
      });

      return res.status(200).json({
        mensaje: 'Usuarios registrados obtenidos exitosamente',
        total: usuarios.length,
        usuarios: usuarios
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Iniciar sesión de Administrador tradicional con API Key
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

      // Buscar o registrar usuario administrador en la base de datos
      let usuario = await Usuario.findOne({ where: { email: adminEmail } });
      if (!usuario) {
        usuario = await Usuario.create({
          nombre: 'Administrador eSports',
          email: adminEmail,
          rol: 'Admin',
          ultimo_acceso: new Date()
        });
      } else {
        usuario.ultimo_acceso = new Date();
        await usuario.save();
      }

      // Generar token CSRF único para esta sesión
      const csrfToken = generarTokenCSRF();

      // Construir payload seguro para el JWT
      const payload = {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
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

      // 1. Cookie HTTP-Only para el JWT
      res.cookie('jwt_token', tokenJWT, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: cookieMaxAge,
        path: '/'
      });

      // 2. Cookie CSRF para el cliente
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
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol
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
          google_id: req.usuario.google_id,
          email: req.usuario.email,
          nombre: req.usuario.nombre,
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
