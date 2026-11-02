import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Cliente de OAuth 2.0 para Google
 */
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || 'dummy_client_id_para_desarrollo',
  process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret_para_desarrollo',
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
);

/**
 * Generar la URL de autorización para iniciar sesión con Google
 */
export const generarGoogleAuthUrl = (state = null) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const params = {
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
    prompt: 'consent'
  };

  if (state) {
    params.state = state;
  }

  return oauth2Client.generateAuthUrl(params);
};

/**
 * Obtener los datos del perfil de usuario a partir del código de autorización devuelto por Google
 */
export const obtenerPerfilGoogle = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  return {
    tokens,
    perfil: data
  };
};

export default {
  oauth2Client,
  generarGoogleAuthUrl,
  obtPerfilGoogle: obtenerPerfilGoogle
};
