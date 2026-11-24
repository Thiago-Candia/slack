import { useEffect, useRef, useState } from "react";
import { useSubmit } from "../../hooks/useSubmit";
import { workspaceService } from "../../services";
import FormError from "../FormError";
import Modal from "../Modal";

const COPIED_FEEDBACK_MS = 2500;

const buildInviteLink = (inviteToken) => `${window.location.origin}/join/${inviteToken}`;

const InviteModal = ({ workspace, onClose }) => {
  const linkRef = useRef(null);
  const [link, setLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState(null);
  const { submit, pending, error } = useSubmit(workspaceService.createInvite);

  useEffect(() => {
    if (!copied) return undefined;

    const timer = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);

    return () => clearTimeout(timer);
  }, [copied]);

  const handleGenerate = async () => {
    const result = await submit(workspace.id);
    if (result.ok) setLink(buildInviteLink(result.data.invite_token));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setCopyStatus({ tone: "success", text: "Link copiado al portapapeles." });
    } catch {
      linkRef.current?.select();
      setCopied(false);
      setCopyStatus({ tone: "hint", text: "No se pudo copiar automáticamente: el link quedó seleccionado para que lo copies." });
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
              <div className="invite-link">
                <input
                  ref={linkRef}
                  id="invite-link"
                  className="invite-link__input"
                  value={link}
                  readOnly
                  onFocus={(event) => event.target.select()}
                />
                <button
                  type="button"
                  className={`invite-link__copy ${copied ? "invite-link__copy--done" : ""}`}
                  onClick={handleCopy}
                >
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
            {copyStatus && (
              <p className={copyStatus.tone === "success" ? "form-success" : "form-hint"} role="status">
                {copyStatus.text}
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
