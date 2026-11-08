# Meta 4.2

Configure `.env` a partir de `.env.example`, incluyendo la base de datos, `JWT_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Ejecute `npm install`, `npm --prefix frontend install` y `npm run db:migrate`. Para iniciar use `npm start` y, en otra terminal, `npm run frontend:dev`. Abra http://localhost:5173.

La migración Meta 4.2 agrega `password_hash` y elimina las columnas `google_id` y `avatar`; respalde la base antes de aplicarla. Las cuentas anteriores de Google no tendrán contraseña local y deben registrarse con otro correo o actualizarse administrativamente. El administrador usa las credenciales configuradas en el entorno. Las cuentas nuevas reciben rol Public.

Para pruebas instale Chromium con `npx playwright install chromium` y ejecute `npm test`. La suite arranca sus propios servidores en los puertos 3000 y 5173 y usa `test-db.sqlite`, independiente de la base configurada en `.env`.
