import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

/**
 * Middleware para validar permisos de Administrador mediante JWT en Cookie HTTP-Only
 * y prevención de CSRF mediante doble submit / validación en header x-csrf-token (Meta 3.4).
 *
 * Mantiene compatibilidad con la regla de x-role: Publico -> 403 de Meta 3.2.
 */
export const requireAdmin = (req, res, next) => {
  // 1. Verificación explícita de rol Público (Meta 3.2)
  const roleHeader = req.headers['x-role'];
  if (roleHeader && roleHeader.toLowerCase() === 'publico') {
    return next(
      new AppError(
        'Acceso denegado: El rol Público solo tiene permisos de lectura. Se requiere rol Admin para esta operación.',
        403
      )
    );
  }

  // 2. Extraer el token JWT de la cookie HTTP-Only o del header Authorization Bearer
  const tokenJWT =
    req.cookies?.jwt_token ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  // Si no hay token JWT proporcionado
  if (!tokenJWT) {
    return next(
      new AppError(
        'Acceso denegado: Se requiere autenticación como Administrador. Token JWT no proporcionado en cookie HTTP-Only.',
        401
      )
    );
  }

  // 3. Validar token JWT
  let decoded;
  try {
    decoded = jwt.verify(
      tokenJWT,
      process.env.JWT_SECRET || 'esports_jwt_secret_super_seguro_2026'
    );
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('La sesión ha expirado. Por favor, vuelva a iniciar sesión.', 401));
    }
    return next(new AppError('Token JWT inválido o adulterado.', 401));
  }

  // 4. Validar rol dentro del JWT
  if (decoded.rol !== 'Admin') {
    return next(new AppError('Acceso denegado: Se requiere rol de Administrador.', 403));
  }

  // 5. Prevención de CSRF para operaciones que modifican el estado (POST, PUT, DELETE, PATCH)
  const esMutacion = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method.toUpperCase());
  if (esMutacion) {
    const csrfToken = req.headers['x-csrf-token'];

    if (!csrfToken) {
      return next(
        new AppError(
          'Protección CSRF: Token CSRF no proporcionado en la cabecera x-csrf-token.',
          403
        )
      );
    }

    if (decoded.csrfToken !== csrfToken) {
      return next(
        new AppError(
          'Protección CSRF: Token CSRF inválido o no coincide con el token de la sesión activa.',
          403
        )
      );
    }
  }

  req.usuario = decoded;
  next();
};
