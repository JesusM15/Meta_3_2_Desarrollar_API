import { AppError } from './errorHandler.js';

/**
 * Middleware para validar permisos por Rol (Admin vs Público)
 * Se puede enviar mediante el encabezado `x-role: Admin` o `x-role: Publico`
 * Por defecto en desarrollo es permisivo si no se envía el header, pero restringe
 * si se especifica rol 'Publico' en operaciones de mutación (POST, PUT, DELETE).
 */
export const requireAdmin = (req, res, next) => {
  const roleHeader = req.headers['x-role'];

  // Si se envía explícitamente rol Público en operaciones de modificación, denegar acceso
  if (roleHeader && roleHeader.toLowerCase() === 'publico') {
    return next(
      new AppError(
        'Acceso denegado: El rol Público solo tiene permisos de lectura. Se requiere rol Admin para esta operación.',
        403
      )
    );
  }

  next();
};
