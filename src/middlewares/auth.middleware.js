import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

/**
 * Middleware para validar la API Key en el header (usado en el Login)
 */
export const validarApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_KEY || 'esports_api_key_admin_2026';

  if (!apiKey) {
    return next(new AppError('API Key no proporcionada en la cabecera x-api-key', 401));
  }

  if (apiKey !== expectedKey) {
    return next(new AppError('API Key inválida', 401));
  }

  next();
};

/**
 * Middleware para verificar el token JWT desde la cookie HTTP-Only
 * y validar el token CSRF desde el header x-csrf-token (Meta 3.4)
 */
export const verificarTokenYCsrf = (req, res, next) => {
  try {
    // 1. Obtener el token JWT de la cookie HTTP-Only (o de Authorization Bearer como fallback)
    const tokenJWT =
      req.cookies?.jwt_token ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!tokenJWT) {
      return next(
        new AppError(
          'Acceso no autorizado: Token JWT no proporcionado. Inicie sesión como Administrador.',
          401
        )
      );
    }

    // 2. Para operaciones de mutación (POST, PUT, DELETE, PATCH), validar token CSRF
    const esMutacion = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method.toUpperCase());
    const csrfToken = req.headers['x-csrf-token'];

    if (esMutacion && !csrfToken) {
      return next(
        new AppError(
          'Protección CSRF activa: Token CSRF no proporcionado en la cabecera x-csrf-token',
          403
        )
      );
    }

    // 3. Verificar la firma y vigencia del token JWT
    const decoded = jwt.verify(
      tokenJWT,
      process.env.JWT_SECRET || 'esports_jwt_secret_super_seguro_2026'
    );

    // 4. Validar coincidencia del token CSRF con el contenido cifrado dentro del JWT
    if (esMutacion && decoded.csrfToken !== csrfToken) {
      return next(
        new AppError('Protección CSRF: Token CSRF inválido o no coincide con la sesión actual', 403)
      );
    }

    // 5. Verificar rol de administrador
    if (decoded.rol !== 'Admin') {
      return next(
        new AppError('Acceso denegado: Se requiere rol de Administrador para esta acción', 403)
      );
    }

    // Adjuntar usuario verificado a la petición
    req.usuario = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token JWT inválido o corrupto', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('La sesión JWT ha expirado. Por favor, vuelva a iniciar sesión.', 401));
    }
    return next(new AppError(`Error en autenticación: ${error.message}`, 500));
  }
};
