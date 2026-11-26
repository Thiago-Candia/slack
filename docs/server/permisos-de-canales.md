# Permisos de canales

Scope `Channel.accessible_by(user)` en `server/app/models/channel.rb`:

| Tipo | Quién accede |
|---|---|
| `public` | Todo miembro del workspace |
| `private` | Solo quienes figuran en `channel_memberships` |
| `direct` | Solo quienes figuran en `channel_memberships` |
