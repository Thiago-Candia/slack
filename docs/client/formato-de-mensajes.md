# Formato de mensajes

Archivo: `client/src/utils/messageFormat.js`.

## Sintaxis

| Marca | Resultado |
|---|---|
| `*texto*` | negrita |
| `_texto_` | cursiva |
| `` `texto` `` | código |
| `[texto](https://url)` | enlace |
| `- ` al inicio de línea | ítem de lista |

El servidor guarda el texto tal cual. El formato solo se interpreta al mostrarlo.

## Reglas del parser (`INLINE`)

- **Sin lookbehind.** Safari anterior a 16.4 no lo soporta y el bundle fallaría al cargar. Por eso la condición "la marca no está pegada a una letra" se resuelve con `BLOCKED_BEFORE` en lugar de con la expresión regular.
- **URLs sueltas.** Se capturan para dejarlas como texto, así sus `_` o `*` no se interpretan como formato.
- **Espacios.** Negrita y cursiva exigen que el contenido no empiece ni termine con espacio: `2 * 3 * 4` queda igual.
- **`BLOCKED_BEFORE`.** Una marca pegada a una letra o a otra marca no abre formato (`snake_case`, `**doble**`).

## `applyFormat(kind, value, start, end)`

Devuelve el texto nuevo y la selección que debe quedar en el textarea.

En listas, si la selección termina justo después de un salto de línea, la línea siguiente no se considera seleccionada.
