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
- Active Storage (avatares de usuario, imagen de workspace)
- Action Mailer (recuperación de contraseña)

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
- **Message** — pertenece a un `Channel` y a un `User` (autor). `body`.

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
