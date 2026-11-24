import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingState } from "./StatusView";

describe("LoadingState", () => {
  it("anuncia el texto a los lectores de pantalla", () => {
    render(<LoadingState>Cargando canales...</LoadingState>);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando canales...");
  });

  it("oculta las barras de carga a las tecnologías de apoyo", () => {
    const { container } = render(<LoadingState />);

    expect(container.querySelector(".skeleton")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll(".skeleton__line")).toHaveLength(3);
  });

  it("deja el texto solo para lectores de pantalla por defecto", () => {
    render(<LoadingState>Cargando canales...</LoadingState>);

    expect(screen.getByText("Cargando canales...")).toHaveClass("visually-hidden");
  });

  it("muestra el texto con showLabel", () => {
    render(<LoadingState showLabel>Validando la invitación...</LoadingState>);

    expect(screen.getByText("Validando la invitación...")).not.toHaveClass("visually-hidden");
    expect(screen.getByRole("status")).toHaveTextContent("Validando la invitación...");
  });

  it("permite elegir la cantidad de barras", () => {
    const { container } = render(<LoadingState lines={5} />);

    expect(container.querySelectorAll(".skeleton__line")).toHaveLength(5);
  });
});
