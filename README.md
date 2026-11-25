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
- Los emails (recuperación de contraseña) se envían con [Resend](https://resend.com) por SMTP. En desarrollo, sin API key, se ven en `http://localhost:3000/letter_opener`. Ver [Emails](#emails-en-desarrollo).

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

### Emails en desarrollo

En desarrollo, por defecto, los emails no se envían: se guardan y se ven en `http://localhost:3000/letter_opener` (por ejemplo, el de recuperación de contraseña, con el link listo para abrir). El enlace vence a las 2 horas y cada pedido nuevo invalida el anterior.

### Envío real con Resend

1. Crear una cuenta en [resend.com](https://resend.com) (plan gratuito: 3.000 emails por mes, 100 por día) y generar una API key en *API Keys*.
2. Definir la variable antes de levantar el server. Nunca subirla al repositorio:

   ```bash
   export RESEND_API_KEY=re_xxxxxxxx
   bin/rails server
   ```

3. Con `RESEND_API_KEY` definida, tanto en desarrollo como en producción los emails salen por `smtp.resend.com`.

**Límite sin dominio propio:** si no verificás un dominio en Resend, el remitente es `onboarding@resend.dev` y **solo se puede enviar al email con el que creaste la cuenta de Resend**. Para enviar a cualquier persona, verificá un dominio en *Domains* y definí `MAILER_FROM`, por ejemplo `Slack Clone <no-reply@tudominio.com>`.

## Variables de entorno

Nunca se suben al repositorio. Solo se versionan los archivos `.env.example`.

| Variable | Dónde | Descripción |
|---|---|---|
| `VITE_URL_API` | `client/.env` | URL base de la API. Es pública en el bundle del navegador: no debe contener secretos. |
| `FRONTEND_URL` | Entorno del servidor | Origen del frontend permitido por CORS, además de `http://localhost:5173`. También es la base del link del email de recuperación de contraseña. |
| `RESEND_API_KEY` | Entorno del servidor | API key de Resend. Si está definida, los emails se envían por `smtp.resend.com`. |
| `SMTP_ADDRESS`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` | Entorno del servidor | Otro proveedor SMTP. Tienen prioridad sobre Resend. Puerto por defecto `587`. |
| `MAILER_FROM` | Entorno del servidor | Remitente. Por defecto `onboarding@resend.dev` con Resend y `no-reply@slack-clone.test` sin SMTP. |
| `APP_HOST` | Entorno del servidor (producción) | Dominio del backend para las URLs generadas en los emails. Opcional. |
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
