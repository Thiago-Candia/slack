import { errorMessage } from "../utils/errors";

export const LoadingState = ({ children = "Cargando...", lines = 3 }) => (
  <div className="state state--loading" role="status">
    <span className="visually-hidden">{children}</span>
    <span className="skeleton" aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className="skeleton__line" />
      ))}
    </span>
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
