import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../App";
import { AuthProvider } from "../context/AuthContext";

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );

describe("pantallas de recuperación de contraseña", () => {
  it("el pedido del enlace muestra el rótulo de sección", () => {
    renderAt("/reset-password");

    expect(screen.getByText("Recupera tu cuenta")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Restablecer la contraseña" })).toBeInTheDocument();
  });

  it("la nueva contraseña muestra el rótulo y la fortaleza mientras se escribe", async () => {
    renderAt("/rewrite-password?reset_token=abc");

    expect(screen.getByText("Recupera tu cuenta")).toBeInTheDocument();

    await userEvent.setup().type(screen.getByLabelText("Contraseña nueva"), "Abcdefgh1!");

    expect(screen.getByText("Fortaleza: Fuerte")).toBeInTheDocument();
  });

  it("el enlace sin código también muestra el rótulo", () => {
    renderAt("/rewrite-password");

    expect(screen.getByText("Recupera tu cuenta")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Enlace incompleto" })).toBeInTheDocument();
  });
});
