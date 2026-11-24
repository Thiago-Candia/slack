import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { getPasswordStrength } from "../utils/validation";
import PasswordStrength from "./PasswordStrength";

describe("getPasswordStrength", () => {
  it("no devuelve nada sin contraseña", () => {
    expect(getPasswordStrength("")).toBeNull();
  });

  it("clasifica como débil lo que no llega al mínimo", () => {
    expect(getPasswordStrength("abc1")).toMatchObject({ level: "weak", score: 1 });
  });

  it("clasifica como débil una contraseña mínima sin variedad", () => {
    expect(getPasswordStrength("abcdefgh")).toMatchObject({ level: "weak" });
  });

  it("clasifica como media una contraseña con algo de variedad", () => {
    expect(getPasswordStrength("password123")).toMatchObject({ level: "medium", score: 2 });
  });

  it("clasifica como fuerte una contraseña con mayúsculas, números y símbolos", () => {
    expect(getPasswordStrength("Abcdefgh1!")).toMatchObject({ level: "strong", score: 3 });
  });
});

describe("PasswordStrength", () => {
  it("mantiene el contenedor anunciable aunque no haya contraseña", () => {
    const { container } = render(<PasswordStrength password="" />);

    expect(container.querySelector("[aria-live='polite']")).toBeEmptyDOMElement();
  });

  it("muestra la fortaleza en texto", () => {
    render(<PasswordStrength password="Abcdefgh1!" />);

    expect(screen.getByText("Fortaleza: Fuerte")).toBeInTheDocument();
  });

  it("enciende tantas barras como el puntaje", () => {
    const { container } = render(<PasswordStrength password="password123" />);

    expect(container.querySelectorAll(".password-strength__bar--on")).toHaveLength(2);
    expect(container.querySelectorAll(".password-strength__bar")).toHaveLength(3);
  });

  it("se actualiza cuando cambia la contraseña", () => {
    const { rerender } = render(<PasswordStrength password="abc" />);
    expect(screen.getByText("Fortaleza: Débil")).toBeInTheDocument();

    rerender(<PasswordStrength password="Abcdefgh1!" />);
    expect(screen.getByText("Fortaleza: Fuerte")).toBeInTheDocument();
  });

  it("oculta las barras a las tecnologías de apoyo", () => {
    const { container } = render(<PasswordStrength password="abc" />);

    expect(container.querySelector(".password-strength__bars")).toHaveAttribute("aria-hidden", "true");
  });
});
