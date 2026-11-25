import { errorMessage } from "../utils/errors";

// showLabel muestra el texto debajo de las barras: en una pantalla completa de carga
// es la única pista de qué se está esperando. En listas y paneles alcanza con las barras.
export const LoadingState = ({ children = "Cargando...", lines = 3, showLabel = false }) => (
  <div className="state state--loading" role="status">
    <span className={showLabel ? "state__label" : "visually-hidden"}>{children}</span>
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
