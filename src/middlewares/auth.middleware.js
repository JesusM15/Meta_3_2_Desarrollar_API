import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

/**
 * Middleware para verificar el token JWT (desde cookie HTTP-Only o Bearer)
 * y validar el token CSRF en mutaciones. Requiere rol Admin.
 */
export const verificarTokenYCsrf = (req, res, next) => {
  try {
    const tokenJWT =
      req.cookies?.jwt_token ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!tokenJWT) {
      return next(
        new AppError('Acceso no autorizado: Token JWT no proporcionado. Inicie sesión.', 401)
      );
    }

    const esMutacion = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method.toUpperCase());
    const csrfToken = req.headers['x-csrf-token'];

    if (esMutacion && !csrfToken) {
      return next(
        new AppError('Protección CSRF activa: Token CSRF no proporcionado en x-csrf-token', 403)
      );
    }

    const decoded = jwt.verify(
      tokenJWT,
      process.env.JWT_SECRET || 'esports_jwt_secret_super_seguro_2026'
    );

    if (esMutacion && decoded.csrfToken !== csrfToken) {
      return next(
        new AppError('Protección CSRF: Token CSRF inválido o no coincide con la sesión', 403)
      );
    }

    if (decoded.rol !== 'Admin') {
      return next(
        new AppError('Acceso denegado: Se requiere rol de Administrador para esta acción', 403)
      );
    }

    req.usuario = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token JWT inválido o corrupto', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('La sesión JWT ha expirado. Vuelva a iniciar sesión.', 401));
    }
    return next(new AppError(`Error en autenticación: ${error.message}`, 500));
  }
};

/**
 * Middleware de autenticación opcional: adjunta req.usuario si hay JWT válido,
 * pero no bloquea si no lo hay. Permite endpoints públicos con info de usuario.
 */
export const autenticacionOpcional = (req, res, next) => {
  try {
    const tokenJWT =
      req.cookies?.jwt_token ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (tokenJWT) {
      const decoded = jwt.verify(
        tokenJWT,
        process.env.JWT_SECRET || 'esports_jwt_secret_super_seguro_2026'
      );
      req.usuario = decoded;
    }
    next();
  } catch {
    // JWT inválido o expirado — continúa sin usuario (acceso público)
    next();
  }
};

/**
 * Middleware que solo verifica JWT (sin exigir rol Admin).
 * Permite acceso a Admin y Public autenticados.
 */
export const verificarToken = (req, res, next) => {
  try {
    const tokenJWT =
      req.cookies?.jwt_token ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!tokenJWT) {
      return next(new AppError('Acceso no autorizado: Token JWT no proporcionado.', 401));
    }

    const decoded = jwt.verify(
      tokenJWT,
      process.env.JWT_SECRET || 'esports_jwt_secret_super_seguro_2026'
    );

    req.usuario = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token JWT inválido o corrupto', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('La sesión JWT ha expirado.', 401));
    }
    return next(new AppError(`Error en autenticación: ${error.message}`, 500));
  }
};
