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
- Los mensajes de canales y mensajes directos se reciben en tiempo real por WebSocket con Action Cable (ver [Tiempo real](#tiempo-real-websocket-con-action-cable)).
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

## Tiempo real: WebSocket con Action Cable

Los mensajes nuevos aparecen en pantalla sin recargar ni consultar la API cada cierto tiempo.

### Cómo funciona

1. Al abrir un canal o un mensaje directo, el front abre una conexión WebSocket a `ws://<API>/cable?token=<JWT>` y se suscribe a `ConversationChannel`.
2. El servidor valida el JWT (`ApplicationCable::Connection`). Si es inválido o falta, rechaza la conexión.
3. `ConversationChannel` solo acepta la suscripción si la persona tiene acceso al canal (o es parte de la conversación directa). Si no, la rechaza.
4. Cuando alguien envía un mensaje por `POST`, el servidor lo guarda, responde por HTTP y lo emite a todos los suscriptos de esa conversación.
5. El front agrega el mensaje a la lista, sin duplicarlo si ya lo tenía (compara por `id`).

El envío sigue siendo una petición HTTP normal. El WebSocket solo se usa para **recibir**.

### Parámetros de suscripción

| Conversación | Parámetros |
|---|---|
| Canal | `channel_id` |
| Mensaje directo | `workspace_id` y `user_id` |

### Evento emitido

```json
{
  "type": "message.created",
  "message": {
    "id": 21,
    "body": "Hola equipo",
    "created_at": "2026-11-13T14:38:03.842Z",
    "sender": { "id": 2, "name": "Ana Pérez", "email": "ana@example.com", "avatar_url": null }
  }
}
```

`message` tiene el mismo formato que la respuesta de `POST /api/v1/channels/:id/messages`.

### Adaptadores (`server/config/cable.yml`)

| Entorno | Adaptador | Motivo |
|---|---|---|
| `development` | `async` | Funciona dentro del mismo proceso, sin servicios extra. |
| `test` | `test` | Permite verificar los broadcasts en los tests. |
| `production` | `solid_cable` | Usa la misma base PostgreSQL de la app (tabla `solid_cable_messages`). No requiere Redis. |

La tabla la crea una migración normal, así que `bin/rails db:prepare` (que corre al arrancar el contenedor) alcanza.

### Por qué WebSocket y Action Cable

| Alternativa | Problema |
|---|---|
| Polling (consultar la API cada pocos segundos) | Genera tráfico aunque no haya mensajes nuevos y siempre hay demora. |
| Server-Sent Events | Solo permite recibir (un sentido). Sirve, pero no cubre usos futuros como "está escribiendo". |
| WebSocket con Action Cable | Conexión abierta en ambos sentidos, latencia baja y sin tráfico inútil. |

Beneficios de usar WebSocket:

- **Inmediatez:** el mensaje llega apenas se guarda.
- **Menos carga:** no se hacen peticiones repetidas para saber si hay algo nuevo.
- **Pensado para chat:** permite ampliar a presencia o "está escribiendo" sin cambiar la arquitectura.

Beneficios de Action Cable:

- **Viene incluido en Rails:** reutiliza modelos, autenticación y tests, sin otro servidor.
- **Canales y transmisión por objeto:** `stream_for` y `broadcast_to` asocian cada conversación con su propio flujo.
- **Cliente oficial:** `@rails/actioncable` gestiona la reconexión automática.
- **Sin Redis en producción:** `solid_cable` usa la base de datos que ya existe.

### Probarlo

1. Levantar el back y el front, y abrir `http://localhost:5173`. Usar `localhost`: con `127.0.0.1` Action Cable rechaza el origen.
2. Iniciar sesión con `admin@example.com` en un navegador y con `ana@example.com` en otro (o en una ventana de incógnito).
3. Escribir en `#general` con una cuenta y comprobar que la otra lo ve sin recargar.

### Notas de seguridad

- La conexión exige un JWT válido y cada suscripción valida el acceso al canal.
- El token viaja en la URL porque el navegador no permite cabeceras en WebSocket. Los logs de Rails lo filtran (`token=[FILTERED]`).
- En producción, `allowed_request_origins` solo acepta el origen de `FRONTEND_URL`.

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
| `VITE_URL_API` | `client/.env` | URL base de la API. También se usa para armar la URL del WebSocket (`http` pasa a `ws` y se agrega `/cable`). Es pública en el bundle del navegador: no debe contener secretos. |
| `FRONTEND_URL` | Entorno del servidor | Origen del frontend permitido por CORS y, en producción, por Action Cable (WebSocket). También es la base del link del email de recuperación de contraseña. Si falta, se usa `http://localhost:5173`. |
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
