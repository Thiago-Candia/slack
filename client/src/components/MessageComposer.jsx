import { useLayoutEffect, useRef, useState } from "react";
import { useSubmit } from "../hooks/useSubmit";
import { ACCEPT, addFiles, formatFileSize } from "../utils/attachments";
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

const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const MessageComposer = ({ placeholder, onSend, disabled }) => {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);
  const formRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingSelection = useRef(null);
  const { submit, pending, error } = useSubmit(onSend);
  const trimmed = body.trim();
  const canSend = (Boolean(trimmed) || files.length > 0) && !pending && !disabled;

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

  const handleFilesSelected = (event) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selected.length) return;

    const result = addFiles(files, selected);
    setFiles(result.files);
    setFileErrors(result.errors);
  };

  const handleRemoveFile = (index) => {
    setFiles((current) => current.filter((_, position) => position !== index));
    setFileErrors([]);
    textareaRef.current?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSend) return;

    setFileErrors([]);
    // Sin archivos se mantiene la firma onSend(body).
    const result = files.length ? await submit(trimmed, files) : await submit(trimmed);
    if (result.ok) {
      setBody("");
      setFiles([]);
    }
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
          <span className="composer__separator" aria-hidden="true" />
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            multiple
            accept={ACCEPT}
            tabIndex={-1}
            aria-hidden="true"
            onChange={handleFilesSelected}
            disabled={disabled}
            data-testid="composer-file-input"
          />
          <button
            type="button"
            className="composer__tool"
            aria-label="Adjuntar archivo"
            title="Adjuntar archivo (hasta 5, de 10 MB cada uno)"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M16.5 6.5v10a4.5 4.5 0 0 1-9 0V6a3 3 0 0 1 6 0v9.5a1.5 1.5 0 0 1-3 0V7H9v8.5a3 3 0 0 0 6 0V6a4.5 4.5 0 0 0-9 0v10.5a6 6 0 0 0 12 0v-10z"
              />
            </svg>
          </button>
        </div>
        {files.length > 0 && (
          <ul className="composer__files" aria-label="Archivos para enviar">
            {files.map((file, index) => (
              <li key={`${fileKey(file)}-${index}`} className="composer__file">
                <span className="composer__file-name">{file.name}</span>
                <span className="composer__file-size">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  className="composer__file-remove"
                  aria-label={`Quitar ${file.name}`}
                  title="Quitar"
                  disabled={pending}
                  onClick={() => handleRemoveFile(index)}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                    <path
                      fill="currentColor"
                      d="m12 10.6 4.9-4.9 1.4 1.4-4.9 4.9 4.9 4.9-1.4 1.4-4.9-4.9-4.9 4.9-1.4-1.4 4.9-4.9-4.9-4.9 1.4-1.4z"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
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
      {fileErrors.length > 0 && (
        <div className="form-error" role="alert">
          <ul>
            {fileErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      <FormError error={error} />
    </form>
  );
};

export default MessageComposer;
