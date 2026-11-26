# Mails

## SMTP (`server/config/smtp_settings.rb`)

`SmtpSettings.call` se usa en los entornos de development y production.

- Con `RESEND_API_KEY`, los mails salen por [Resend](https://resend.com) (`smtp.resend.com`, usuario `resend`).
- Cualquier otro proveedor funciona con `SMTP_ADDRESS`, `SMTP_PORT`, `SMTP_USERNAME` y `SMTP_PASSWORD`.
- Sin ninguna de esas variables devuelve `nil` y el entorno mantiene su método de entrega por defecto.

## Remitente (`server/app/mailers/application_mailer.rb`)

Orden de prioridad:
1. `MAILER_FROM`, si está definido.
2. Con `RESEND_API_KEY`: el remitente compartido de Resend (`onboarding@resend.dev`). Funciona sin dominio verificado, pero **solo entrega al mail del dueño de la cuenta de Resend**. Para enviar a cualquier persona hay que verificar un dominio y definir `MAILER_FROM`.
3. Si no, `no-reply@slack-clone.test`.
