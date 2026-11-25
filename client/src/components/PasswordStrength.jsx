import { getPasswordStrength } from "../utils/validation";

const LEVELS = 3;

// Siempre renderiza el contenedor para que el lector de pantalla anuncie los cambios.
const PasswordStrength = ({ password }) => {
  const strength = getPasswordStrength(password);

  return (
    <div className="password-strength" aria-live="polite">
      {strength && (
        <div className={`password-strength__content password-strength--${strength.level}`}>
          <span className="password-strength__bars" aria-hidden="true">
            {Array.from({ length: LEVELS }, (_, index) => (
              <span key={index} className={`password-strength__bar ${index < strength.score ? "password-strength__bar--on" : ""}`} />
            ))}
          </span>
          <span className="password-strength__label">Fortaleza: {strength.label}</span>
        </div>
      )}
    </div>
  );
};

export default PasswordStrength;
