# Deploy

- **API** (`server/`): [Render](https://render.com), con Docker y PostgreSQL, definido en `render.yaml`.
- **Client** (`client/`): [Vercel](https://vercel.com).
- **Emails**: [Resend](https://resend.com).
- **Archivos subidos** (avatares, imágenes de workspace): un bucket S3 compatible. Es opcional pero recomendado.

Todo tiene plan gratuito. Ninguna clave se sube al repositorio: se cargan en el panel de cada servicio.

## 0. Antes de empezar

Render y Vercel despliegan la rama por defecto del repositorio (`main`). Mergeá primero en `develop` y después `develop` en `main`:

- [x] PR #9 – mensajes en tiempo real con Action Cable (`8-feat/websocket`)
- [ ] PR #26 – restablecimiento de contraseña y Resend (`25-fix/password-reset-mail`)
- [ ] PR #29 – base de datos única con Solid Queue, Cache y Cable (`27-fix/single-production-database`)
- [ ] PR #30 – esta configuración de deploy (`28-chore/render-vercel-deploy`)

## 1. Resend (emails)

1. Crear una cuenta en resend.com y una API key en **API Keys**. Guardala: la vas a cargar en Render.
2. Sin dominio propio, el remitente es `onboarding@resend.dev` y **solo llegan emails al email de tu cuenta de Resend**. Para mandar a cualquiera: **Domains → Add domain**, cargar los registros DNS y usar `MAILER_FROM`, por ejemplo `Slack Clone <no-reply@tudominio.com>`.

## 2. Bucket para archivos (opcional)

El disco de Render se borra en cada deploy. Sin bucket, los avatares y las imágenes de workspace se pierden. Cualquier servicio S3 compatible sirve:

| Servicio | `STORAGE_ENDPOINT` | `STORAGE_REGION` |
|---|---|---|
| Supabase Storage | `https://<proyecto>.supabase.co/storage/v1/s3` | la región del proyecto, por ejemplo `us-east-1` |
| Cloudflare R2 | `https://<account_id>.r2.cloudflarestorage.com` | `auto` |
| AWS S3 | (vacío) | la región del bucket |

Creá un bucket **privado** y unas claves S3 (access key y secret). Rails sirve los archivos con URLs firmadas.

## 3. Render (API)

1. En Render: **New → Blueprint**, conectar el repositorio de GitHub. Render lee `render.yaml` y crea:
   - `slack-db`: PostgreSQL (free).
   - `slack-api`: el server en Docker, con `DATABASE_URL`, `SECRET_KEY_BASE` y `SOLID_QUEUE_IN_PUMA` ya configuradas.
2. Render pide los valores marcados como `sync: false`. Por ahora cargá:
   - `RESEND_API_KEY`: la API key de Resend.
   - `MAILER_FROM`: solo si verificaste un dominio.
   - `STORAGE_*`: solo si creaste un bucket.
   - `FRONTEND_URL`: dejalo vacío por ahora; se completa en el paso 5.
3. Esperá el primer deploy. Al arrancar, el contenedor corre `bin/rails db:prepare`, que crea todas las tablas.
4. Probá `https://slack-api.onrender.com/up` (con el nombre que te haya dado Render): tiene que responder con una página verde.

Límites del plan gratuito: el server se duerme después de unos minutos sin uso y el primer pedido tarda cerca de un minuto. La base gratuita vence después de un tiempo; revisá las condiciones actuales en Render.

## 4. Vercel (client)

1. **Add New → Project**, importar el repositorio.
2. **Root Directory**: `client`. Vercel detecta Vite: build `npm run build`, output `dist`.
3. **Environment Variables**: `VITE_URL_API` = la URL de Render, sin barra final, por ejemplo `https://slack-api.onrender.com`.
4. Deploy. `client/vercel.json` ya redirige todas las rutas a `index.html`.

## 5. Conectar los dos

En Render → `slack-api` → **Environment**, definí `FRONTEND_URL` con la URL de Vercel, por ejemplo `https://slack-clone.vercel.app`, sin barra final. Guardá: Render redeploya solo.

`FRONTEND_URL` se usa para:
- CORS: el navegador solo acepta respuestas de la API para ese origen.
- El link del email de recuperación de contraseña.
- Los orígenes permitidos de Action Cable (tiempo real).

## 6. Verificación

- [ ] `/up` de la API responde 200.
- [ ] En la URL de Vercel: registrarse, crear un workspace y un canal, y mandar un mensaje.
- [ ] Invitar a otra cuenta con el link de invitación y chatear entre dos navegadores.
- [ ] "Olvidé mi contraseña" con el email de tu cuenta de Resend: llega el mail y el link funciona.
- [ ] Subir un avatar, redeployar en Render y comprobar que sigue estando (si configuraste un bucket).

## Variables de entorno del server

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí (la pone Render) | Conexión a PostgreSQL. |
| `SECRET_KEY_BASE` | Sí (la genera Render) | Firma de sesiones y de los JWT. Si cambia, todas las sesiones se cierran. |
| `SOLID_QUEUE_IN_PUMA` | Sí | `true`: procesa los emails y otros jobs dentro del server web. |
| `FRONTEND_URL` | Sí | URL del client en Vercel. |
| `RESEND_API_KEY` | Para emails | API key de Resend. |
| `MAILER_FROM` | No | Remitente con dominio verificado. |
| `APP_HOST` | No | Dominio propio de la API. Render ya permite su dominio `*.onrender.com` con `RENDER_EXTERNAL_HOSTNAME`. |
| `STORAGE_BUCKET`, `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` | No | Bucket S3 compatible para los archivos subidos. Sin `STORAGE_BUCKET` se usa el disco local. |
| `RAILS_LOG_LEVEL` | No | Por defecto `info`. |

## Sin Render

El `Dockerfile` de `server/` funciona en cualquier plataforma que corra contenedores (Railway, Fly.io, un VPS): hay que pasarle las mismas variables. El contenedor escucha en `$PORT`, o en 3000 por defecto.
