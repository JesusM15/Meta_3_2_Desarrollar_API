# Práctica de Laboratorio: REST API & Frontend Admin - eSports Rosters (Meta 3.2 & Meta 3.4)

**Asignatura:** Desarrollo de Aplicaciones Web  
**Metas:** 3.2 (Desarrollar API REST con Sequelize) y 3.4 (Frontend Admin + Autorización JWT, Cookies HTTP-Only y CSRF Protection)  
**Tecnologías Backend:** Node.js, Express.js (ES6), Sequelize ORM, MySQL 8.0 / SQLite, JWT (`jsonwebtoken`), `cookie-parser`, OpenAPI 3.0 / Swagger UI  
**Tecnologías Frontend:** Vue.js 3, Vite, Vanilla CSS con Diseño Hextech / Cyberpunk eSports  
**Autor:** [JesusM15](https://github.com/JesusM15/Meta_3_2_Desarrollar_API)

---

## 📋 1. Objetivo del Proyecto

El proyecto proporciona una solución integral (Backend RESTful + Frontend SPA) para organizaciones y ligas de **eSports (League of Legends)**:
1. **Backend RESTful:** Gestión en capas (Rutas, Controladores, Servicios, Modelos y Migraciones) para administrar jugadores, rosters y asignaciones cumpliendo con reglas de negocio estrictas.
2. **Frontend para Rol Admin:** Interfaz web moderna, interactiva y desacoplada construida con Vue 3 y Vite, con tablero táctico de la Grieta del Invocador para los 5 roles (`Top`, `Jungle`, `Mid`, `ADC`, `Support`) y banca de suplentes.
3. **Mecanismo de Autorización Robusto (Meta 3.4):** Autenticación de Administrador basada en **JWT almacenado en Cookie HTTP-Only** (anti-XSS) y prevención activa de **CSRF (Cross-Site Request Forgery)** mediante el patrón de doble token (`x-csrf-token`).

---

## 🔐 2. Seguridad y Arquitectura de Autenticación (Meta 3.4)

El sistema implementa la arquitectura de seguridad requerida en la **Meta 3.4**:

```text
Cliente (Frontend Vue 3)                              Servidor (Express API)
  │                                                        │
  ├─────── 1. POST /api/v1/auth/login ────────────────────>│ (Valida x-api-key y credenciales)
  │        Headers: x-api-key: [API_KEY]                   │ Genera Token CSRF y JWT
  │        Body: { email, password }                       │
  │<────── 2. Set-Cookie: jwt_token (HttpOnly) ────────────┤
  │        Set-Cookie: csrf_token                          │
  │        Body: { csrfToken, usuario }                    │
  │                                                        │
  │  (El cliente guarda csrfToken en memoria)              │
  │                                                        │
  ├─────── 3. Petición Mutación (POST / PUT / DELETE) ────>│ Middleware requireAdmin:
  │        Cookie: jwt_token (Automática por navegador)    │ 1. Verifica firma del JWT
  │        Header: x-csrf-token: [csrfToken]               │ 2. Compara CSRF header con JWT
  │<────── 4. 200 OK / 201 Created / 204 No Content ───────┤ 3. Si CSRF falta o no coincide -> 403
```

### Características de Seguridad:
- **Protección Anti-XSS:** El token JWT viaja en una cookie con bandera `HttpOnly=true`. JavaScript no puede leer este token vía `document.cookie`.
- **Prevención Anti-CSRF:** Cada operación de modificación (`POST`, `PUT`, `DELETE`, `PATCH`) exige la cabecera `x-csrf-token`. Dado que un atacante externo no puede leer este token por la Política del Mismo Origen (SOP), cualquier intento de ataque CSRF es bloqueado con código `403 Forbidden`.
- **API Key inicial:** El endpoint de login exige la cabecera `x-api-key`.
- **Consola de Auditoría en Vivo:** El frontend incluye una pestaña dedicada a auditar y simular ataques CSRF en tiempo real para verificar la respuesta del servidor (`201` con token válido vs `403` sin token o adulterado).

---

## 📐 3. Reglas de Negocio Implementadas

- **RN-01 (Nickname Único):** El apodo del jugador es único globalmente (`409 Conflict`).
- **RN-02 (Máximo 5 Titulares):** Un roster no puede superar 5 titulares (`409 Conflict`).
- **RN-03 (Roles Únicos):** No puede haber dos titulares con la misma posición en un roster (`409 Conflict`).
- **RN-04 (Múltiples Rosters):** Un jugador puede ser titular o suplente en más de un roster.
- **RN-05 (Integridad):** Eliminar un roster preserva intactos a los jugadores en la base de datos (eliminación en cascada únicamente sobre la tabla pivote).

---

## 🗄️ 4. Modelo de Datos Relacional

```text
Jugador
├── id (PK, INT AUTO_INCREMENT)
├── nickname (VARCHAR, Único, Not Null)
├── nombre_real (VARCHAR, Nullable)
├── pais (VARCHAR, Nullable)
├── rol (VARCHAR: Top | Jungle | Mid | ADC | Support)
└── estado (VARCHAR: activo | inactivo)

Roster
├── id (PK, INT AUTO_INCREMENT)
├── nombre (VARCHAR, Not Null)
├── juego (VARCHAR, Default: 'League of Legends')
├── tipo (VARCHAR: Principal | Academy)
└── temporada (VARCHAR: ej. '2026')

Roster_Jugador (Tabla Intermedia N:M)
├── id (PK, INT AUTO_INCREMENT)
├── id_roster (FK -> rosters.id, ON DELETE CASCADE)
├── id_jugador (FK -> jugadores.id, ON DELETE CASCADE)
└── rol_en_roster (VARCHAR: Titular | Suplente)
```

---

## 🚀 5. Instrucciones de Instalación y Ejecución

### Requisitos Previos
- Node.js (v18.0 o superior)
- MySQL Server (v8.0+) o SQLite (soporte embebido)
- Git

### 1. Clonar el Repositorio
```bash
git clone https://github.com/JesusM15/Meta_3_2_Desarrollar_API.git
cd Meta_3_2_Desarrollar_API
```

### 2. Instalar Dependencias del Backend y Frontend
```bash
# Dependencias del servidor:
npm install

# Dependencias del cliente Vue:
npm run frontend:install
```

### 3. Configurar Variables de Entorno (`.env`)
Crear un archivo `.env` en la raíz (puede basarse en `.env.example`):
```env
PORT=3000
NODE_ENV=development

# Base de Datos (MySQL)
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=esports_db
DB_USER=root
DB_PASSWORD=tu_contrasena

# Configuración JWT y CSRF (Meta 3.4)
JWT_SECRET=esports_jwt_secret_super_seguro_2026
JWT_EXPIRES_IN=2h
API_KEY=esports_api_key_admin_2026
COOKIE_MAX_AGE=7200000
CLIENT_URL=http://localhost:5173

# Credenciales de Administrador por defecto
ADMIN_EMAIL=admin@esports.com
ADMIN_PASSWORD=admin123
```

### 4. Reiniciar Base de Datos y Cargar Seeders
```bash
npm run db:reset
```

### 5. Iniciar la Aplicación

#### A) Iniciar Servidor Backend (Puerto 3000):
```bash
npm run dev
# o npm start
```
El servidor backend iniciará en: `http://localhost:3000`

#### B) Iniciar Frontend Admin en Vue 3 (Puerto 5173):
En otra terminal dentro de la raíz:
```bash
npm run frontend:dev
```
Abre en tu navegador: 👉 **`http://localhost:5173`**

### 6. Ejecutar Batería de Pruebas Automatizadas
```bash
npm test
```
Ejecuta **29 pruebas automatizadas integrales** que validan:
- Endpoints auxiliares y de salud.
- Autenticación con API Key, emisión de Cookies HTTP-Only y token CSRF.
- Bloqueo de peticiones sin token (401) y sin CSRF (403).
- Las 5 reglas de negocio de eSports (RN-01 a RN-05).
- Tiempos de respuesta menores a 500 ms (RNF-03).

---

## 🖥️ 6. Características del Frontend Admin

El frontend desarrollado en `frontend/` cuenta con:
1. **Pantalla de Inicio de Sesión:** Con validación de API Key, correo y contraseña de administrador, botón de carga rápida de credenciales demo e información de seguridad.
2. **Tablero Táctico de League of Legends:** Representación visual de las 5 posiciones titulares (`Top`, `Jungle`, `Mid`, `ADC`, `Support`) con avatares, cambio de titular a suplente y advertencias visuales de reglas de negocio en vivo.
3. **Banca de Suplentes:** Lista de jugadores en reserva con ascenso directo a titular.
4. **Módulo de Jugadores:** Búsqueda en tiempo real por apodo, filtros combinables por rol y estado, y modales interactivos para registrar, editar y dar de baja.
5. **Consola de Auditoría CSRF & JWT:** Panel interactivo para probar en vivo la respuesta del backend ante peticiones legítimas y ante simulaciones de ataque CSRF.

---

## 📖 7. Documentación OpenAPI / Swagger

| Recurso | URL | Descripción |
| :--- | :--- | :--- |
| **Swagger UI Interactivo** | `http://localhost:3000/api/v1/docs` | Pruebas directas de endpoints en navegador |
| **OpenAPI Specification (JSON)** | `http://localhost:3000/api/v1/openapi.json` | Especificación JSON estandarizada |
| **Sitio de Documentación Estático** | `http://localhost:3000/docs-site/index.html` | Portal web de documentación |

---

## 📁 8. Estructura del Repositorio

```text
meta_3_2/
├── frontend/                        # APLICACIÓN FRONTEND VUE 3 + VITE (Meta 3.4)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.vue           # Barra superior con estado de seguridad y usuario
│   │   │   ├── LoginView.vue        # Pantalla de login Admin con CSRF info
│   │   │   ├── DashboardView.vue    # Métricas y accesos rápidos
│   │   │   ├── JugadoresView.vue    # CRUD completo y filtros de jugadores
│   │   │   ├── RostersView.vue      # Tablero táctico LoL y gestión de alineaciones
│   │   │   └── SeguridadView.vue    # Laboratorio interactivo de pruebas CSRF / JWT
│   │   ├── services/
│   │   │   └── api.js               # Cliente HTTP con credentials: 'include' y CSRF
│   │   ├── App.vue                  # Orquestador principal y notificaciones toast
│   │   ├── main.js                  # Entrada Vue 3
│   │   └── style.css                # Sistema de diseño Cyberpunk / Hextech LoL
│   ├── index.html                   # HTML base con fuentes Outfit y Rajdhani
│   ├── package.json                 # Dependencias de Vue 3 y Vite
│   └── vite.config.js               # Configuración de proxy a backend en :3000
├── src/                             # SERVIDOR BACKEND REST API (Meta 3.2 & 3.4)
│   ├── config/
│   │   └── database.js              # Sequelize ORM (MySQL con fallback a SQLite)
│   ├── controllers/
│   │   ├── auth.controller.js       # Login, Logout y Verify con JWT y CSRF
│   │   ├── jugadores.controller.js  # Controladores de jugadores
│   │   ├── rosters.controller.js    # Controladores de rosters y asignaciones
│   │   └── auxiliares.controller.js # Controladores de roles, estados y salud
│   ├── database/
│   │   ├── migrations/              # Migraciones de base de datos
│   │   ├── seeders/                 # Datos iniciales (T1 y G2)
│   │   ├── reset.js                 # Reseteo completo de base de datos
│   │   └── test-api.js              # Suite de 29 pruebas automatizadas
│   ├── middlewares/
│   │   ├── auth.middleware.js       # Validación de API Key y tokens JWT + CSRF
│   │   ├── roleAuth.js              # Verificación de permisos de Admin
│   │   └── errorHandler.js          # Manejador centralizado de errores
│   ├── models/                      # Modelos Sequelize y asociaciones N:M
│   ├── routes/                      # Enrutadores modulares de la API
│   └── app.js                       # Express con cookie-parser y CORS con credenciales
├── .env.example                     # Plantilla de variables de entorno
├── test-collection.http             # Colección de peticiones HTTP con flujo de Auth
├── package.json                     # Scripts y dependencias principales
├── server.js                        # Punto de arranque del servidor backend
└── README.md                        # Documentación completa del proyecto
```
