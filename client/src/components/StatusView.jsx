import { errorMessage } from "../utils/errors";

export const LoadingState = ({ children = "Cargando..." }) => (
  <div className="state state--loading" role="status">
    <span className="spinner" aria-hidden="true" />
    <span>{children}</span>
  </div>
);

export const EmptyState = ({ title, children }) => (
  <div className="state state--empty">
    {title && <p className="state__title">{title}</p>}
    {children}
  </div>
);

export const ErrorState = ({ error, message, onRetry }) => (
  <div className="state state--error" role="alert">
    <p>{message || errorMessage(error)}</p>
    {onRetry && (
      <button type="button" className="button button--secondary button--small" onClick={onRetry}>
        Reintentar
      </button>
    )}
  </div>
);
