# Pantallas y componentes

## Registro (`screens/RegisterScreen.jsx`)

- La API de registro no recibe imagen. Si la persona eligió una, se sube con el perfil apenas existe la cuenta.
- Si esa subida falla, la cuenta ya está creada: se muestra un aviso y la imagen se puede cambiar después desde el perfil.
- El token se guarda antes de subir la imagen para que `httpClient` autentique la petición; `login()` lo vuelve a guardar después.
- `pendingToken` guarda el token de una cuenta creada cuya foto no se pudo subir: se inicia sesión al confirmar el aviso.

## Estados de carga (`components/StatusView.jsx`)

`showLabel` muestra el texto debajo de las barras. En una pantalla completa de carga es la única pista de qué se está esperando; en listas y paneles alcanza con las barras.

## Modal de perfil (`components/ProfileModal.jsx`)

Al volver de la edición, el foco regresa al botón "Editar". No se enfoca al abrir el modal porque `Modal` guarda el elemento enfocado en ese momento para devolverle el foco al cerrar.

## Búsqueda en el espacio de trabajo (`screens/WorkspaceScreen.jsx`)

La búsqueda pertenece al espacio en el que se escribió (`search.workspaceId`). Al cambiar de espacio arranca vacía, sin necesidad de un efecto extra.

## Fortaleza de la contraseña

- `components/PasswordStrength.jsx` siempre renderiza el contenedor para que el lector de pantalla anuncie los cambios.
- `getPasswordStrength` (`utils/validation.js`) es solo una ayuda visual: la regla de validación sigue siendo la longitud mínima.

## Colores de avatar (`utils/format.js`)

`AVATAR_COLORS` define los pares de fondo y texto para las iniciales. Todos tienen contraste suficiente.
