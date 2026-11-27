import { assetUrl } from "../utils/assets";
import { formatFileSize, isImageAttachment } from "../utils/attachments";

const FileIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m7 1.5V9h5.5zM8 13v2h8v-2zm0 4v2h5v-2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M11 4h2v8.2l3.3-3.3 1.4 1.4L12 16l-5.7-5.7 1.4-1.4 3.3 3.3zM5 18h14v2H5z" />
  </svg>
);

// Las imágenes se ven en la conversación; el resto de los archivos se descarga.
const MessageAttachments = ({ attachments, onMediaLoad }) => {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;

  return (
    <ul className="message-attachments" aria-label="Archivos adjuntos">
      {attachments.map((attachment) => {
        const size = formatFileSize(attachment.byte_size);
        const isImage = isImageAttachment(attachment);

        return (
          <li key={attachment.id} className={`message-attachments__item ${isImage ? "" : "message-attachments__item--file"}`}>
            {isImage ? (
              <a
                className="message-attachment message-attachment--image"
                href={assetUrl(attachment.url)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Abrir ${attachment.filename}`}
              >
                <img src={assetUrl(attachment.url)} alt={attachment.filename} onLoad={onMediaLoad} />
              </a>
            ) : (
              <a
                className="message-attachment message-attachment--file"
                href={assetUrl(attachment.download_url || attachment.url)}
                download={attachment.filename}
                title={`Descargar ${attachment.filename}`}
              >
                <span className="message-attachment__icon">
                  <FileIcon />
                </span>
                <span className="message-attachment__info">
                  <span className="message-attachment__name">{attachment.filename}</span>
                  {size && <span className="message-attachment__size">{size}</span>}
                </span>
                <span className="message-attachment__action">
                  <DownloadIcon />
                  <span className="visually-hidden">Descargar</span>
                </span>
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default MessageAttachments;
