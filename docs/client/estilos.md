# Estilos

## Organización

`client/src/styles/base.css`, en orden:
1. Variables y reset
2. Botones
3. Formularios
4. Estados: carga, vacío, error
5. Avatar
6. Modal
7. Marca y botón de usuario

`client/src/styles/workspace.css`, en orden:
1. Rail de espacios de trabajo
2. Buscador
3. Barra lateral
4. Bienvenida
5. Conversación
6. Pantallas chicas (`max-width: 768px`): la barra lateral se abre como panel.

## Decisiones

- **`.invite-link`** usa `--color-surface` de fondo: "Copiar" y "Copiado" necesitan contraste 4,5:1, y sobre `--color-surface-muted` quedaban en 4,2:1.
- **`.state--loading .state__label`** tiene `order: 1`: el texto se ve después de las barras aunque en el DOM esté antes, para que el lector de pantalla lo lea primero.
