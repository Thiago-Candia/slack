import { useRef, useState } from "react";
import { useSubmit } from "../hooks/useSubmit";
import FormError from "./FormError";

const MessageComposer = ({ placeholder, onSend, disabled }) => {
  const [body, setBody] = useState("");
  const formRef = useRef(null);
  const { submit, pending, error } = useSubmit(onSend);
  const trimmed = body.trim();
  const canSend = Boolean(trimmed) && !pending && !disabled;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSend) return;

    const result = await submit(trimmed);
    if (result.ok) setBody("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form ref={formRef} className="composer" onSubmit={handleSubmit}>
      <div className="composer__box">
        <textarea
          className="composer__input"
          aria-label="Mensaje"
          placeholder={placeholder}
          rows={1}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button type="submit" className="composer__send" disabled={!canSend} aria-label="Enviar mensaje">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
          </svg>
        </button>
      </div>
      {pending && (
        <p className="composer__status" role="status">
          Enviando...
        </p>
      )}
      <FormError error={error} />
    </form>
  );
};

export default MessageComposer;
