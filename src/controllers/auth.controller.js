import jwt from 'jsonwebtoken';

import crypto from 'crypto';

import { AppError } from '../middlewares/errorHandler.js';

import { Usuario } from '../models/index.js';



/**

 * Generar un token CSRF criptográficamente seguro

 */

export const generarTokenCSRF = () => {

  return crypto.randomBytes(32).toString('hex');

};



// Las contraseñas nuevas usan scrypt con sal aleatoria. Se aceptan hashes

// anteriores para migrarlos tras un inicio de sesión correcto.

const hashPassword = (password) => {

  const salt = crypto.randomBytes(16).toString('hex');

  return `scrypt:${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;

};

const verifyPassword = (password, stored) => {

  if (!stored) return false;

  if (!stored.startsWith('scrypt:')) {

    const legacy = crypto.createHmac('sha256', process.env.JWT_SECRET || 'esports_jwt_secret_super_seguro_2026').update(password).digest('hex');

    return stored === legacy;

  }

  const [, salt, hash] = stored.split(':');

  if (!salt || !/^[a-f0-9]{128}$/.test(hash || '')) return false;

  return crypto.timingSafeEqual(crypto.scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));

};



/**

 * Generar JWT + cookies para un usuario autenticado

 */

const emitirSesion = (res, usuario) => {

  const csrfToken = generarTokenCSRF();



  const payload = {

    id: usuario.id,

    email: usuario.email,

    nombre: usuario.nombre,

    rol: usuario.rol,

    csrfToken

  };



  const tokenJWT = jwt.sign(

    payload,

    process.env.JWT_SECRET || 'esports_jwt_secret_super_seguro_2026',

    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }

  );



  const isProduction = process.env.NODE_ENV === 'production';

  const cookieMaxAge = parseInt(process.env.COOKIE_MAX_AGE, 10) || 7200000;



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



  return { tokenJWT, csrfToken };

};



/**

 * Controlador de Autenticación con JWT, Cookies HTTP-Only y CSRF (Meta 4.2)

 * Autenticación local: usuario/password almacenados en DB (Admin por .env)

 */

class AuthController {

  /**

   * Iniciar sesión con email + password

   * POST /auth/login

   * Body: { email, password }

   */

  async login(req, res, next) {

    try {

      const { email, password } = req.body;



      if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {

        throw new AppError('El email y la contraseña son requeridos', 400);

      }



      const adminEmail = process.env.ADMIN_EMAIL || 'admin@esports.com';

      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';



      let usuario = null;



      // Verificar si es el administrador configurado en .env

      if (email.trim().toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {

        // Buscar o crear usuario admin en DB

        usuario = await Usuario.findOne({ where: { email: adminEmail } });

        if (!usuario) {

          usuario = await Usuario.create({

            nombre: 'Administrador eSports',

            email: adminEmail,

            rol: 'Admin',

            ultimo_acceso: new Date()

          });

        } else {

          usuario.rol = 'Admin';

          usuario.ultimo_acceso = new Date();

          await usuario.save();

        }

      } else {

        // Buscar usuario en DB por email

        usuario = await Usuario.findOne({ where: { email: email.trim().toLowerCase() } });



        if (!usuario) {

          throw new AppError('Credenciales inválidas', 401);

        }



        if (!verifyPassword(password, usuario.password_hash)) {

          throw new AppError('Credenciales inválidas', 401);

        }



        if (!usuario.password_hash.startsWith('scrypt:')) usuario.password_hash = hashPassword(password);

        usuario.ultimo_acceso = new Date();

        await usuario.save();

      }



      const { csrfToken } = emitirSesion(res, usuario);



      return res.status(200).json({

        mensaje: 'Inicio de sesión exitoso',

        usuario: {

          id: usuario.id,

          email: usuario.email,

          nombre: usuario.nombre,

          rol: usuario.rol

        },

        csrfToken

      });

    } catch (error) {

      next(error);

    }

  }



  /**

   * Registrar nuevo usuario (rol Public por defecto)

   * POST /auth/register

   * Body: { nombre, email, password }

   */

  async register(req, res, next) {

    try {

      const { nombre, email, password } = req.body;



      if (typeof nombre !== 'string' || !nombre.trim() || typeof email !== 'string' || !email.trim() || typeof password !== 'string') {

        throw new AppError('nombre, email y password son requeridos', 400);

      }



      if (password.length < 6) {

        throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);

      }



      if (email.trim().toLowerCase() === (process.env.ADMIN_EMAIL || 'admin@esports.com').toLowerCase()) {

        throw new AppError('Ya existe un usuario con ese correo electrónico', 409);

      }



      const existente = await Usuario.findOne({ where: { email: email.trim().toLowerCase() } });

      if (existente) {

        throw new AppError('Ya existe un usuario con ese correo electrónico', 409);

      }



      const passwordHash = hashPassword(password);



      const usuario = await Usuario.create({

        nombre: nombre.trim(),

        email: email.trim().toLowerCase(),

        password_hash: passwordHash,

        rol: 'Public',

        ultimo_acceso: new Date()

      });



      const { csrfToken } = emitirSesion(res, usuario);



      return res.status(201).json({

        mensaje: 'Registro exitoso',

        usuario: {

          id: usuario.id,

          email: usuario.email,

          nombre: usuario.nombre,

          rol: usuario.rol

        },

        csrfToken

      });

    } catch (error) {

      next(error);

    }

  }



  /**

   * Cerrar sesión y revocar cookies

   * POST /auth/logout

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



      return res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });

    } catch (error) {

      next(error);

    }

  }



  /**

   * Verificar estado de autenticación actual

   * GET /auth/verify  (requiere JWT válido)

   */

  async verify(req, res, next) {

    try {

      return res.status(200).json({

        autenticado: true,

        usuario: {

          id: req.usuario.id,

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



  /**

   * Obtener lista de usuarios registrados (solo Admin)

   * GET /auth/usuarios — requiere rol Admin en el JWT

   */

  async listarUsuarios(req, res, next) {

    try {

      // Verificar que el usuario autenticado es Admin

      if (!req.usuario || req.usuario.rol !== 'Admin') {

        const { AppError: Err } = await import('../middlewares/errorHandler.js');

        return next(new Err('Acceso denegado: Se requiere rol de Administrador', 403));

      }



      const usuarios = await Usuario.findAll({

        attributes: ['id', 'nombre', 'email', 'rol', 'ultimo_acceso', 'createdAt'],

        order: [['id', 'ASC']]

      });



      return res.status(200).json({

        mensaje: 'Usuarios registrados obtenidos exitosamente',

        total: usuarios.length,

        usuarios

      });

    } catch (error) {

      next(error);

    }

  }

}



export default new AuthController();
