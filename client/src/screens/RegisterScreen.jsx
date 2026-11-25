import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import FormError from "../components/FormError";
import ImageField from "../components/ImageField";
import PasswordStrength from "../components/PasswordStrength";
import TextField from "../components/TextField";
import { useAuth } from "../context/AuthContext";
import { useSubmit } from "../hooks/useSubmit";
import { authService, profileService } from "../services";
import { setToken } from "../services/session";
import {
  MIN_PASSWORD_LENGTH,
  collectErrors,
  validateEmail,
  validateImage,
  validateNewPassword,
  validatePasswordConfirmation,
  validateRequired
} from "../utils/validation";

// La API de registro no recibe imagen: si la persona eligió una, se sube con el perfil apenas existe la cuenta.
// Si esa subida falla, la cuenta ya está creada: se avisa y la imagen se puede cambiar después desde el perfil.
const registerAccount = async ({ avatar, ...credentials }) => {
  const data = await authService.register(credentials);

  if (!avatar) return data;

  const formData = new FormData();
  formData.append("avatar", avatar);
  // El token se guarda antes de la subida para que httpClient la autentique; login() lo vuelve a guardar después.
  setToken(data.token);
  const avatarSaved = await profileService.update(formData).then(
    () => true,
    () => false
  );

  return { ...data, avatarSaved };
};

const RegisterScreen = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", passwordConfirmation: "" });
  const [avatar, setAvatar] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const { submit, pending, error } = useSubmit(registerAccount);
  // Token de una cuenta creada cuya foto no se pudo subir: se entra al confirmar el aviso.
  const [pendingToken, setPendingToken] = useState(null);

  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSelectAvatar = (file) => {
    const avatarError = validateImage(file);
    setFieldErrors((previous) => collectErrors({ ...previous, avatar: avatarError }));
    if (!avatarError) setAvatar(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = collectErrors({
      name: validateRequired(form.name, "Ingresá tu nombre."),
      email: validateEmail(form.email),
      password: validateNewPassword(form.password),
      passwordConfirmation: validatePasswordConfirmation(form.password, form.passwordConfirmation)
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const result = await submit({ name: form.name.trim(), email: form.email.trim(), password: form.password, avatar });

    if (!result.ok) return;

    if (result.data.avatarSaved === false) setPendingToken(result.data.token);
    else login(result.data.token);
  };

  if (pendingToken) {
    return (
      <AuthLayout title="Tu cuenta está lista">
        <p className="notice" role="alert">
          No pudimos guardar tu foto de perfil. Podés subirla más tarde desde tu perfil.
        </p>
        <button type="button" className="button button--primary button--block" onClick={() => login(pendingToken)}>
          Continuar
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Crear una cuenta"
      subtitle="Después vas a poder crear un espacio de trabajo o unirte a uno."
      footer={
        <p>
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      }
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Nombre"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={fieldErrors.name}
          required
        />
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="nombre@ejemplo.com"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
          required
        />
        <TextField
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="new-password"
          hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
          required
        />
        <PasswordStrength password={form.password} />
        <TextField
          label="Repetir contraseña"
          type="password"
          name="passwordConfirmation"
          autoComplete="new-password"
          value={form.passwordConfirmation}
          onChange={handleChange}
          error={fieldErrors.passwordConfirmation}
          required
        />
        <ImageField
          label="Imagen de perfil (opcional)"
          file={avatar}
          fallbackName={form.name}
          shape="square"
          onSelect={handleSelectAvatar}
          onRemove={() => setAvatar(null)}
          error={fieldErrors.avatar}
        />
        <FormError error={error} />
        <button type="submit" className="button button--primary button--block" disabled={pending}>
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default RegisterScreen;
