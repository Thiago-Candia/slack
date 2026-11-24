import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWorkspaces } from "../context/WorkspaceContext";
import { useSubmit } from "../hooks/useSubmit";
import { profileService } from "../services";
import { collectErrors, validateImage, validateRequired } from "../utils/validation";
import Avatar from "./Avatar";
import FormError from "./FormError";
import ImageField from "./ImageField";
import Modal from "./Modal";
import TextField from "./TextField";

const localTimeFormatter = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" });

const ProfileModal = ({ onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { user, updateUser } = useWorkspaces();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const { submit, pending, error } = useSubmit(profileService.update);

  const handleSelectAvatar = (file) => {
    const avatarError = validateImage(file);
    setFieldErrors((previous) => collectErrors({ ...previous, avatar: avatarError }));
    if (!avatarError) setAvatar(file);
  };

  const handleEdit = () => {
    setName(user?.name || "");
    setAvatar(null);
    setFieldErrors({});
    setSaved(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatar(null);
    setFieldErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaved(false);

    const errors = collectErrors({ name: validateRequired(name, "Ingresá tu nombre.") });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const formData = new FormData();
    formData.append("name", name.trim());
    if (avatar) formData.append("avatar", avatar);

    const result = await submit(formData);

    if (result.ok) {
      updateUser(result.data);
      setAvatar(null);
      setIsEditing(false);
      setSaved(true);
    }
  };

  const handleLogout = () => {
    onClose();
    navigate("/login", { replace: true });
    logout();
  };

  if (isEditing) {
    return (
      <Modal title="Editar perfil" onClose={onClose}>
        <form className="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Nombre"
            name="name"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={fieldErrors.name}
            required
          />
          <ImageField
            label="Foto de perfil"
            file={avatar}
            currentUrl={user?.avatar_url}
            fallbackName={name || user?.name}
            shape="square"
            onSelect={handleSelectAvatar}
            onRemove={() => setAvatar(null)}
            error={fieldErrors.avatar}
          />
          <FormError error={error} />
          <div className="form__actions form__actions--split">
            <button type="button" className="button button--ghost" onClick={handleCancel}>
              Cancelar
            </button>
            <button type="submit" className="button button--primary" disabled={pending}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal title="Tu perfil" onClose={onClose}>
      <div className="profile">
        <div className="profile__avatar">
          <Avatar name={user?.name} src={user?.avatar_url} size="lg" shape="square" />
        </div>
        <div className="profile__head">
          <h3 className="profile__name">{user?.name}</h3>
          <button type="button" className="button button--ghost button--small profile__edit" onClick={handleEdit} autoFocus>
            Editar
          </button>
        </div>
        <p className="profile__meta">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16m-1 3v6l4.3 2.6.8-1.3-3.6-2.1V7z" />
          </svg>
          {localTimeFormatter.format(new Date())} hora local
        </p>
        {saved && (
          <p className="form-success" role="status">
            Perfil actualizado.
          </p>
        )}
        <section className="profile__section" aria-labelledby="profile-contact">
          <h3 id="profile-contact" className="profile__section-title">
            Información de contacto
          </h3>
          <p className="profile__contact">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1m1 2v.5l8 5 8-5V7zm16 3-8 5-8-5V17h16z" />
            </svg>
            {user?.email}
          </p>
        </section>
        <div className="form__actions">
          <button type="button" className="button button--ghost" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileModal;
