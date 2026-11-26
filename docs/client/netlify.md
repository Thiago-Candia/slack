# Deploy del client

## Netlify (`client/netlify.toml`)

- Directorio base: `client`. Build: `npm run build`, publica `dist`.
- Al ser una SPA, toda ruta (`/login`, `/join/:token`, ...) sirve `index.html` con status 200 para que React Router la resuelva. Sin esto, los links de invitación y las rutas profundas devuelven 404.
