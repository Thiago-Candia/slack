import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WorkspaceRail from "./WorkspaceRail";

const workspaces = [
  { id: 1, name: "Equipo de Producto", image_url: null },
  { id: 2, name: "Cátedra Programación IV", image_url: null }
];
const user = { id: 7, name: "Ana Pérez", avatar_url: null };

const renderRail = (path = "/workspace/2/channel/5", currentUser = user) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <WorkspaceRail workspaces={workspaces} user={currentUser} />
    </MemoryRouter>
  );

describe("WorkspaceRail", () => {
  it("lista los espacios de trabajo y enlaza a cada uno", () => {
    renderRail();

    expect(screen.getByRole("link", { name: "Equipo de Producto" })).toHaveAttribute("href", "/workspace/1");
    expect(screen.getByRole("link", { name: "Cátedra Programación IV" })).toHaveAttribute("href", "/workspace/2");
  });

  it("marca como actual el espacio abierto, también dentro de un canal", () => {
    renderRail("/workspace/2/channel/5");

    expect(screen.getByRole("link", { name: "Cátedra Programación IV" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Equipo de Producto" })).not.toHaveAttribute("aria-current");
  });

  it("enlaza a Inicio y a crear un espacio de trabajo", () => {
    renderRail();

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/home");
    expect(screen.getByRole("link", { name: "Crear espacio de trabajo" })).toHaveAttribute("href", "/new-workspace");
  });

  it("muestra el botón de perfil solo con una persona con sesión", () => {
    renderRail();
    expect(screen.getByRole("button", { name: "Abrir perfil de Ana Pérez" })).toBeInTheDocument();
  });

  it("no muestra el botón de perfil sin usuario", () => {
    renderRail("/workspace/1", null);
    expect(screen.queryByRole("button", { name: /abrir perfil/i })).not.toBeInTheDocument();
  });
});
