# Tests del client

- `components/workspace/InviteModal.test.jsx`: el aviso del modal de invitación es una indicación, no un éxito, por eso el test verifica que no use la clase `form-success` (estilo verde).
- `components/MessageList.test.jsx`: los separadores de fecha no cuentan como mensajes para los lectores de pantalla, por eso la lista tiene solo los `listitem` de los mensajes.
