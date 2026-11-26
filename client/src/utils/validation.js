const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const validateEmail = (email) => {
  if (!email.trim()) return "Ingresá tu email.";
  if (!EMAIL_PATTERN.test(email.trim())) return "Ingresá un email válido.";
  return null;
};

export const validateRequired = (value, message) => (value.trim() ? null : message);

export const validateNewPassword = (password) => {
  if (!password) return "Ingresá una contraseña.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
};

export const validatePasswordConfirmation = (password, confirmation) =>
  password === confirmation ? null : "Las contraseñas no coinciden.";

export const getPasswordStrength = (password) => {
  if (!password) return null;
  if (password.length < MIN_PASSWORD_LENGTH) return { level: "weak", label: "Débil", score: 1 };

  const points = [
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length;

  if (points === 0) return { level: "weak", label: "Débil", score: 1 };
  if (points <= 2) return { level: "medium", label: "Media", score: 2 };

  return { level: "strong", label: "Fuerte", score: 3 };
};

export const validateImage = (file) => {
  if (!file) return null;
  if (!file.type.startsWith("image/")) return "El archivo tiene que ser una imagen.";
  if (file.size > MAX_IMAGE_BYTES) return "La imagen no puede pesar más de 5 MB.";
  return null;
};

export const collectErrors = (checks) =>
  Object.fromEntries(Object.entries(checks).filter(([, message]) => Boolean(message)));
