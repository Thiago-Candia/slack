import { useRef, useState } from "react";
import { useSubmit } from "../../hooks/useSubmit";
import { workspaceService } from "../../services";
import FormError from "../FormError";
import Modal from "../Modal";

const buildInviteLink = (inviteToken) => `${window.location.origin}/join/${inviteToken}`;

const InviteModal = ({ workspace, onClose }) => {
  const linkRef = useRef(null);
  const [link, setLink] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);
  const { submit, pending, error } = useSubmit(workspaceService.createInvite);

  const handleGenerate = async () => {
    const result = await submit(workspace.id);
    if (result.ok) setLink(buildInviteLink(result.data.invite_token));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopyStatus("Link copiado al portapapeles.");
    } catch {
      linkRef.current?.select();
      setCopyStatus("No se pudo copiar automáticamente: el link quedó seleccionado para que lo copies.");
    }
  };

  return (
    <Modal title={`Invitar personas a ${workspace.name}`} onClose={onClose}>
      <div className="form">
        <p className="muted">
          Compartí este link con quien quieras sumar. Al abrirlo e iniciar sesión, entra al espacio de trabajo.
        </p>
        {link ? (
          <>
            <div className="field">
              <label className="field__label" htmlFor="invite-link">
                Link de invitación
              </label>
              <div className="copy-row">
                <input
                  ref={linkRef}
                  id="invite-link"
                  className="field__input"
                  value={link}
                  readOnly
                  onFocus={(event) => event.target.select()}
                />
                <button type="button" className="button button--primary" onClick={handleCopy}>
                  Copiar
                </button>
              </div>
            </div>
            {copyStatus && (
              <p className="form-success" role="status">
                {copyStatus}
              </p>
            )}
          </>
        ) : (
          <button type="button" className="button button--primary" onClick={handleGenerate} disabled={pending}>
            {pending ? "Generando..." : "Generar link de invitación"}
          </button>
        )}
        <FormError error={error} />
      </div>
    </Modal>
  );
};

export default InviteModal;
