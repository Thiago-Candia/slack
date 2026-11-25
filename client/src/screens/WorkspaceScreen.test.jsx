import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import WorkspaceScreen from "./WorkspaceScreen";

const workspaces = [
  { id: 1, name: "Equipo de Producto", image_url: null, users: [] },
  { id: 2, name: "Cátedra Programación IV", image_url: null, users: [] }
];
const ana = { id: 7, name: "Ana Pérez", email: "ana@example.com", avatar_url: null };

vi.mock("../context/WorkspaceContext", () => ({
  useWorkspaces: () => ({ user: ana, workspaces, status: "ready", error: null, reload: vi.fn() })
}));
vi.mock("../services", () => ({
  channelService: { getByWorkspace: vi.fn().mockResolvedValue([{ id: 3, name: "general" }]) }
}));
vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn() }) }));

const renderScreen = () =>
  render(
    <MemoryRouter initialEntries={["/workspace/1"]}>
      <Routes>
        <Route path="/workspace/:workspace_id" element={<WorkspaceScreen />} />
      </Routes>
    </MemoryRouter>
  );

describe("WorkspaceScreen", () => {
  it("vacía el buscador al cambiar de espacio de trabajo", async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.type(screen.getByRole("searchbox", { name: "Buscar en Equipo de Producto" }), "gen");
    expect(screen.getByRole("searchbox", { name: "Buscar en Equipo de Producto" })).toHaveValue("gen");

    await user.click(screen.getByRole("link", { name: "Cátedra Programación IV" }));

    expect(await screen.findByRole("searchbox", { name: "Buscar en Cátedra Programación IV" })).toHaveValue("");
  });
});
