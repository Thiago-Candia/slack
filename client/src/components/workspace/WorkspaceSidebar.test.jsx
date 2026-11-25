import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import WorkspaceSidebar from "./WorkspaceSidebar";

const workspace = {
  id: 1,
  name: "Equipo de Producto",
  members: [
    { id: 1, name: "Ana Pérez", avatar_url: null },
    { id: 2, name: "Bruno Díaz", avatar_url: null }
  ]
};
const channels = {
  status: "ready",
  data: [
    { id: 10, name: "general" },
    { id: 11, name: "random" }
  ],
  reload: () => {}
};

const renderSidebar = (props = {}) =>
  render(
    <MemoryRouter>
      <WorkspaceSidebar
        id="sidebar"
        workspace={workspace}
        channels={channels}
        currentUser={{ id: 1 }}
        isOpen={false}
        onCreateChannel={() => {}}
        onInvite={() => {}}
        {...props}
      />
    </MemoryRouter>
  );

describe("WorkspaceSidebar", () => {
  it("muestra el nombre del espacio en el encabezado", () => {
    renderSidebar();

    expect(screen.getByText("Equipo de Producto")).toBeInTheDocument();
  });

  it("lista todos los canales y personas sin filtro", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: /general/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /random/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ana Pérez/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bruno Díaz/ })).toBeInTheDocument();
  });

  it("filtra los canales por nombre", () => {
    renderSidebar({ query: "gen" });

    expect(screen.getByRole("link", { name: /general/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /random/ })).not.toBeInTheDocument();
  });

  it("filtra las personas sin distinguir mayúsculas ni tildes", () => {
    renderSidebar({ query: "diaz" });

    expect(screen.getByRole("link", { name: /Bruno Díaz/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ana Pérez/ })).not.toBeInTheDocument();
  });

  it("avisa cuando nada coincide con la búsqueda", () => {
    renderSidebar({ query: "zzz" });

    expect(screen.getByText("Ningún canal coincide con «zzz».")).toBeInTheDocument();
    expect(screen.getByText("Nadie coincide con «zzz».")).toBeInTheDocument();
  });

  it("invita desde el encabezado", async () => {
    const onInvite = vi.fn();
    renderSidebar({ onInvite });

    await userEvent.setup().click(screen.getByRole("button", { name: "Invitar a este espacio" }));

    expect(onInvite).toHaveBeenCalledTimes(1);
  });
});
