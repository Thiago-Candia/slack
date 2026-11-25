# Slack Clone — Backend (Ruby on Rails)

Trabajo Práctico N.º 1 — Programación IV. Backend de Slack: workspaces, canales,
mensajería (de canal y directa), invitaciones por link y back-office administrativo.

El frontend se desarrolla por separado en el Trabajo Práctico N.º 2 y consume este backend exclusivamente a través de la API (`/api/v1`).

## Tecnologías

- Ruby 3.3.10
- Rails 8.1 (API + back-office server-rendered en la misma app)
- PostgreSQL
- Autenticación: `has_secure_password` (bcrypt) + JWT (gema `jwt`) para la API, sesión de
  cookie de Rails para el back-office
- Active Storage (avatares de usuario, imagen de workspace, adjuntos de mensajes)
- Action Mailer + [Resend](https://resend.com) por SMTP (recuperación de contraseña)
- `letter_opener_web` para ver los emails en desarrollo

## Requisitos previos

- Ruby 3.3.10 (ver `.ruby-version`)
- PostgreSQL corriendo localmente
- Bundler (`gem install bundler`)

## Instalación y ejecución

```bash
git clone https://github.com/Thiago-Candia/slack.git
cd slack/server

bundle install
```

## Preparación de la base de datos

```bash
bin/rails db:create
bin/rails db:migrate
bin/rails db:seed
```

`db:seed` carga datos de ejemplo: un usuario administrador, un usuario miembro, un workspace,
un canal `general` y un par de mensajes (ver [Credenciales](#credenciales-y-acceso-al-back-office)).

## Levantar el servidor

```bash
bin/rails server
```

La app queda disponible en `http://localhost:3000`. El back-office está en
`http://localhost:3000/admin`, la API en `http://localhost:3000/api/v1`.

## Variables de entorno

| Variable | Uso | Default si no se define |
|---|---|---|
| `FRONTEND_URL` | Origen permitido por CORS y base de los links que se envían por email (ej. reset de contraseña) | `http://localhost:5173` |
| `RESEND_API_KEY` | API key de Resend. Si está definida, los emails se envían por `smtp.resend.com` (desarrollo y producción) | Sin envío real: en desarrollo se ven en `/letter_opener` |
| `MAILER_FROM` | Remitente de los emails | `onboarding@resend.dev` con Resend, `no-reply@slack-clone.test` sin SMTP |
| `SMTP_ADDRESS`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` | Otro proveedor SMTP en lugar de Resend; tienen prioridad | Puerto `587` |
| `STORAGE_BUCKET` | Bucket S3 compatible (AWS S3, Cloudflare R2, Backblaze B2…) para avatares, imágenes de workspace y adjuntos. Solo en producción | Disco local (`storage/`) |
| `STORAGE_ENDPOINT` | Endpoint del proveedor, si no es AWS (ej. `https://<account>.r2.cloudflarestorage.com`) | Endpoint de AWS |
| `STORAGE_REGION` | Región del bucket | `auto` |
| `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` | Credenciales del bucket | — |

En producción hace falta `STORAGE_BUCKET`: sin él los archivos se guardan en el disco del
contenedor, que en Render se borra en cada deploy.

Ninguna clave se sube al repositorio: se definen como variables de entorno.

## Emails (Resend)

La recuperación de contraseña envía un email con un link a `FRONTEND_URL/rewrite-password?reset_token=…`, que vence a las 2 horas. El envío lo hace un job (`deliver_later`).

**En desarrollo, sin API key**: los emails no salen de la máquina. Se guardan y se ven en `http://localhost:3000/letter_opener`, con el link listo para abrir.

**Con Resend** (plan gratuito: 3.000 emails por mes, 100 por día):

1. Crear una cuenta en [resend.com](https://resend.com) y una API key en *API Keys*.
2. Levantar el server con la clave como variable de entorno. En WSL/Ubuntu:

   ```bash
   export RESEND_API_KEY=re_xxxxxxxx
   bundle exec rails server
   ```

3. En el log aparece `Delivered mail …` y el envío se ve en Resend → *Emails*.

**Límite sin dominio propio**: el remitente es `onboarding@resend.dev` y Resend **solo entrega al email de la cuenta de Resend**. Para enviar a cualquier usuario, verificar un dominio en Resend → *Domains* y definir `MAILER_FROM`, por ejemplo `Slack Clone <no-reply@tudominio.com>`.

| Error en el log | Causa |
|---|---|
| `535 Authentication` / `Net::SMTPAuthenticationError` | API key incorrecta o revocada |
| `You can only send testing emails to your own email address` | Destinatario distinto del email de la cuenta de Resend (sin dominio verificado) |
| No aparece `Delivered mail` | El email pedido no está registrado: la API responde igual, sin enviar nada |

Si una API key se filtra (commit, chat, issue), borrarla en Resend y crear una nueva.

## Credenciales y acceso al back-office

El back-office (`/admin`) usa sesión de Rails (cookie) y solo permite entrar a usuarios con
`admin: true`. El seed crea:

| Rol | Email | Password |
|---|---|---|
| Administrador | `admin@example.com` | `password123` |
| Usuario miembro (no admin, solo para probar la API) | `ana@example.com` | `password123` |

La API usa JWT: `POST /api/v1/login` devuelve un `token` que se manda como
`Authorization: Bearer <token>` en el resto de los requests.

## Modelo de datos

5 modelos principales, relacionados entre sí:

- **User** — `name`, `email`, `password_digest`, `admin` (flag para acceso al back-office),
  `reset_password_token` / `reset_password_sent_at`. Tiene un avatar (Active Storage).
- **Workspace** — `name`, `owner` (User dueño), `invite_token` (para sumar miembros por link).
  Tiene una imagen (Active Storage).
- **Membership** — tabla de unión `User` ↔ `Workspace`, con `role` (`owner` / `admin` / `member`).
- **Channel** — pertenece a un `Workspace`. `name`, `kind` (`public` / `private` / `direct`).
  Un canal `direct` representa una conversación 1 a 1 entre dos usuarios (no tiene nombre).
- **ChannelMembership** — tabla de unión `User` ↔ `Channel`.
- **Message** — pertenece a un `Channel` y a un `User` (autor). `body` y hasta 5 archivos
  adjuntos (`files`, Active Storage). Necesita texto o al menos un adjunto.

Relaciones principales:

```
User 1─N Membership N─1 Workspace
User 1─N ChannelMembership N─1 Channel N─1 Workspace
User 1─N Message N─1 Channel
Workspace 1─N Channel
```

## Endpoints de la API (`/api/v1`)

Todos responden JSON. Los marcados con 🔒 requieren `Authorization: Bearer <token>`.

**Autenticación**
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/register` | Crea una cuenta |
| POST | `/api/v1/login` | Devuelve el token JWT |
| DELETE | `/api/v1/logout` | Cierre de sesión (no-op del lado servidor; el cliente descarta el token) |
| POST | `/api/v1/password-resets` | Genera un token de recuperación y envía el mail |
| PATCH | `/api/v1/password-resets/:token` | Define la nueva contraseña |

**Perfil** 🔒
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/profile` | Datos del usuario autenticado |
| PATCH | `/api/v1/profile` | Actualiza nombre / avatar |

**Workspaces** 🔒 (salvo `join`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/workspaces` | Workspaces del usuario |
| POST | `/api/v1/workspaces` | Crea un workspace (crea también el canal `general`) |
| GET | `/api/v1/workspaces/:id` | Detalle |
| PATCH | `/api/v1/workspaces/:id` | Editar |
| DELETE | `/api/v1/workspaces/:id` | Eliminar |
| POST | `/api/v1/workspaces/:id/invite` | Devuelve el `invite_token` del workspace |
| POST | `/api/v1/join/:token` | Une al usuario autenticado al workspace del token |

**Canales y mensajes** 🔒
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/workspaces/:workspace_id/channels` | Canales del workspace |
| POST | `/api/v1/workspaces/:workspace_id/channels` | Crear canal |
| GET/PATCH/DELETE | `/api/v1/channels/:id` | Detalle / editar / eliminar |
| GET | `/api/v1/channels/:channel_id/messages` | Mensajes del canal |
| POST | `/api/v1/channels/:channel_id/messages` | Enviar mensaje |
| DELETE | `/api/v1/messages/:id` | Eliminar mensaje propio |

**Mensajes directos** 🔒
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/workspaces/:workspace_id/direct_messages/:user_id` | Historial de DM con ese usuario (crea el canal directo si no existe) |
| POST | `/api/v1/workspaces/:workspace_id/direct_messages/:user_id` | Enviar mensaje directo |

**Adjuntos en mensajes**

Los dos `POST` de mensajes (canal y directo) aceptan archivos. Sin adjuntos el body puede ser
JSON (`{ "body": "Hola" }`); con adjuntos va como `multipart/form-data`:

```bash
curl -X POST http://localhost:3000/api/v1/channels/1/messages \
  -H "Authorization: Bearer <token>" \
  -F "body=Te paso el informe" \
  -F "files[]=@informe.pdf" \
  -F "files[]=@foto.png"
```

- Hasta **5 archivos** por mensaje, de hasta **10 MB** cada uno.
- Tipos permitidos: PNG, JPEG, GIF, WebP, PDF, TXT, CSV, DOCX, XLSX, PPTX y ZIP. El tipo se
  detecta por el contenido y el nombre del archivo; el que declara el navegador se ignora.
- `body` puede quedar vacío si hay al menos un adjunto.
- `files[]` solo acepta archivos subidos en el request: cualquier otro valor responde `422`.
- Un archivo fuera de las reglas responde `422` con el motivo en `errors` y no se guarda nada.

Cada mensaje (en las respuestas y en el evento `message.created` de Action Cable) incluye
`attachments`, un array vacío si no tiene:

```json
{
  "id": 12,
  "body": "Te paso el informe",
  "created_at": "2026-11-25T18:00:00.000Z",
  "sender": { "id": 1, "name": "Ana", "email": "ana@example.com", "avatar_url": null },
  "attachments": [
    {
      "id": 7,
      "filename": "informe.pdf",
      "content_type": "application/pdf",
      "byte_size": 48213,
      "url": "/rails/active_storage/blobs/redirect/…/informe.pdf",
      "download_url": "/rails/active_storage/blobs/redirect/…/informe.pdf?disposition=attachment"
    }
  ]
}
```

`url` y `download_url` son rutas relativas al server, firmadas y **sin autenticación**: quien
tenga el enlace puede abrir el archivo hasta que vence, a las 24 horas. Al listar los mensajes
se generan enlaces nuevos. Eliminar un mensaje borra también sus archivos.

**Miembros** 🔒
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/workspaces/:workspace_id/memberships` | Miembros del workspace |
| POST | `/api/v1/workspaces/:workspace_id/memberships` | Agregar miembro por email |
| DELETE | `/api/v1/workspaces/:workspace_id/memberships/:id` | Quitar miembro |

## Back-office (`/admin`)

CRUD completo (server-rendered, con vistas y formularios de Rails) sobre Usuarios, Workspaces
y Canales; alta/baja de Memberships; listado y baja de Mensajes. Protegido por login con
sesión — sin loguearse redirige a `/admin/session/new`.

## Comandos útiles

```bash
bin/rails test           # tests automatizados
bundle exec rubocop      # estilo y calidad de código
bundle exec brakeman     # análisis estático de seguridad
```

## Deploy

No se realizó deploy — el proyecto se corre localmente.
