# Slack - Programación IV

Clon de Slack con espacios de trabajo, canales y mensajes directos.

| Carpeta | Contenido |
|---|---|
| `client/` | Frontend en React 19 + Vite |
| `server/` | Backend en Ruby on Rails 8 (modo API) con PostgreSQL |
| `wireframes/` | Diseños de referencia de las pantallas |

## Estado

- El backend expone la API REST en `/api/v1` con autenticación JWT y mantiene el back-office en `/admin`.
- El frontend consume esa API: registro, inicio de sesión, recuperación de contraseña, workspaces, invitaciones, canales, mensajes, mensajes directos y perfil.

## Rutas del frontend

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/login`, `/register` | Iniciar sesión / crear cuenta | Pública |
| `/reset-password`, `/rewrite-password?reset_token=…` | Recuperar contraseña | Pública |
| `/home` | Mis espacios de trabajo | Con sesión |
| `/new-workspace` | Crear espacio de trabajo | Con sesión |
| `/join/:token` | Unirse por link de invitación | Con sesión (sin sesión, pasa por el login y vuelve) |
| `/workspace/:workspace_id` | Espacio de trabajo | Con sesión |
| `/workspace/:workspace_id/channel/:channel_id` | Chat de canal | Con sesión |
| `/workspace/:workspace_id/dm/:user_id` | Mensaje directo | Con sesión |

## Requisitos

- Node.js 20 o superior
- Ruby 3.3.10
- PostgreSQL

## Puesta en marcha

### Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Se sirve en `http://localhost:5173`.

### Backend

```bash
cd server
bin/setup --skip-server
bin/rails server
```

Se sirve en `http://localhost:3000`.

### Datos de prueba

`bin/rails db:seed` crea las cuentas `admin@example.com` y `ana@example.com` (contraseña `password123`) dentro del workspace "Cátedra Programación IV".

## Variables de entorno

Nunca se suben al repositorio. Solo se versionan los archivos `.env.example`.

| Variable | Dónde | Descripción |
|---|---|---|
| `VITE_URL_API` | `client/.env` | URL base de la API. Es pública en el bundle del navegador: no debe contener secretos. |
| `FRONTEND_URL` | Entorno del servidor | Origen del frontend permitido por CORS, además de `http://localhost:5173`. |
| `SERVER_DATABASE_PASSWORD` | Entorno del servidor (producción) | Contraseña de PostgreSQL. |
| `RAILS_MASTER_KEY` | Entorno del servidor (producción) | Clave para descifrar `config/credentials.yml.enc`. |
| `RAILS_MAX_THREADS` | Entorno del servidor | Hilos de Puma y conexiones a la base de datos. Opcional. |

`server/config/master.key` está ignorada por Git. Guarda una copia en un gestor de contraseñas: sin ella no se pueden descifrar las credenciales.

## Scripts del frontend

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `client/dist` |
| `npm run lint` | ESLint |
| `npm test` | Tests con Vitest y Testing Library |
| `npm run test:watch` | Tests en modo observador |
| `npm run preview` | Sirve el build localmente |

## Despliegue del frontend

`client/vercel.json` reescribe todas las rutas a `index.html` para el enrutado del lado del cliente. Define `VITE_URL_API` en el panel de Vercel.
