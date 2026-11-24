import { useLayoutEffect, useRef, useState } from "react";
import { useSubmit } from "../hooks/useSubmit";
import { applyFormat } from "../utils/messageFormat";
import FormError from "./FormError";

const TOOLS = [
  { kind: "bold", label: "Negrita", hint: "Ctrl+B", icon: <path fill="currentColor" d="M7 5h6a3.5 3.5 0 0 1 2.5 6A3.5 3.5 0 0 1 14 18H7zm2.5 2.5v3h3a1.5 1.5 0 0 0 0-3zm0 5.5v3h4a1.5 1.5 0 0 0 0-3z" /> },
  { kind: "italic", label: "Cursiva", hint: "Ctrl+I", icon: <path fill="currentColor" d="M10 5h8v2h-3l-3 10h3v2H6v-2h3l3-10h-2z" /> },
  { kind: "link", label: "Enlace", icon: <path fill="currentColor" d="M10.6 13.4a1 1 0 0 1 0-1.4l3-3a3 3 0 0 1 4.2 4.2l-2 2-1.4-1.4 2-2a1 1 0 0 0-1.4-1.4l-3 3a1 1 0 0 1-1.4 0M13.4 10.6a1 1 0 0 1 0 1.4l-3 3a3 3 0 0 1-4.2-4.2l2-2 1.4 1.4-2 2a1 1 0 0 0 1.4 1.4l3-3a1 1 0 0 1 1.4 0" /> },
  { kind: "list", label: "Lista", icon: <path fill="currentColor" d="M4 6h2v2H4zm5 0h11v2H9zm-5 5h2v2H4zm5 0h11v2H9zm-5 5h2v2H4zm5 0h11v2H9z" /> },
  { kind: "code", label: "Código", hint: "Ctrl+E", icon: <path fill="currentColor" d="m8.6 16.6-4.6-4.6 4.6-4.6 1.4 1.4L6.8 12l3.2 3.2zm6.8 0-1.4-1.4 3.2-3.2L14 8.8l1.4-1.4 4.6 4.6z" /> }
];

const SHORTCUTS = { b: "bold", i: "italic", e: "code" };

const MessageComposer = ({ placeholder, onSend, disabled }) => {
  const [body, setBody] = useState("");
  const formRef = useRef(null);
  const textareaRef = useRef(null);
  const pendingSelection = useRef(null);
  const { submit, pending, error } = useSubmit(onSend);
  const trimmed = body.trim();
  const canSend = Boolean(trimmed) && !pending && !disabled;

  useLayoutEffect(() => {
    const selection = pendingSelection.current;
    if (!selection) return;

    pendingSelection.current = null;
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(selection.start, selection.end);
  }, [body]);

  const handleFormat = (kind) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    const result = applyFormat(kind, body, textarea.selectionStart, textarea.selectionEnd);
    pendingSelection.current = result;
    setBody(result.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSend) return;

    const result = await submit(trimmed);
    if (result.ok) setBody("");
  };

  const handleKeyDown = (event) => {
    const shortcut = (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey ? SHORTCUTS[event.key.toLowerCase()] : null;

    if (shortcut) {
      event.preventDefault();
      handleFormat(shortcut);
      return;
    }

    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form ref={formRef} className="composer" onSubmit={handleSubmit}>
      <div className="composer__box">
        <div className="composer__toolbar" role="toolbar" aria-label="Formato del mensaje">
          {TOOLS.map((tool) => (
            <button
              key={tool.kind}
              type="button"
              className="composer__tool"
              aria-label={tool.label}
              title={tool.hint ? `${tool.label} (${tool.hint})` : tool.label}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleFormat(tool.kind)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                {tool.icon}
              </svg>
            </button>
          ))}
        </div>
        <div className="composer__row">
          <textarea
            ref={textareaRef}
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
