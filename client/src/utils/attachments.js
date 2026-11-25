// Mismas reglas que valida el servidor (server/app/models/message.rb).
export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Se valida por extensión: el tipo que informa el navegador varía según el sistema
// (Windows declara los CSV como application/vnd.ms-excel). El servidor revisa el contenido.
export const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "pdf", "txt", "csv", "docx", "xlsx", "pptx", "zip"];

export const ACCEPT = ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(",");

export const ALLOWED_DESCRIPTION = "PNG, JPG, GIF, WebP, PDF, TXT, CSV, Word, Excel, PowerPoint o ZIP";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

const extensionOf = (name = "") => {
  const dot = name.lastIndexOf(".");

  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
};

export const fileError = (file) => {
  if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) {
    return `«${file.name}» no es de un tipo permitido (${ALLOWED_DESCRIPTION}).`;
  }

  if (file.size > MAX_FILE_SIZE) return `«${file.name}» supera los 10 MB.`;

  return null;
};

// Suma los archivos elegidos a los que ya estaban, descarta los que no cumplen las reglas
// y devuelve los motivos para mostrarlos.
export const addFiles = (current, incoming) => {
  const files = [...current];
  const errors = [];

  for (const file of incoming) {
    const error = fileError(file);

    if (error) {
      errors.push(error);
    } else if (files.length >= MAX_FILES) {
      errors.push(`Podés adjuntar hasta ${MAX_FILES} archivos por mensaje.`);
      break;
    } else {
      files.push(file);
    }
  }

  return { files, errors };
};

export const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const rounded = value < 10 ? value.toFixed(1).replace(/\.0$/, "") : Math.round(value);

  return `${String(rounded).replace(".", ",")} ${units[unit]}`;
};

export const isImageAttachment = (attachment) => IMAGE_TYPES.includes(attachment?.content_type);
