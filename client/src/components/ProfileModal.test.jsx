import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProfileModal from "./ProfileModal";

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  updateUser: vi.fn(),
  update: vi.fn()
}));

const ana = { id: 1, name: "Ana Pérez", email: "ana@example.com", avatar_url: null };

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ logout: mocks.logout }) }));
vi.mock("../context/WorkspaceContext", () => ({ useWorkspaces: () => ({ user: ana, updateUser: mocks.updateUser }) }));
vi.mock("../services", () => ({ profileService: { update: mocks.update } }));

const renderModal = (onClose = vi.fn()) => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ProfileModal onClose={onClose} />
    </MemoryRouter>
  );

  return { user, onClose };
};

describe("ProfileModal", () => {
  beforeEach(() => {
    mocks.update.mockResolvedValue({ ...ana, name: "Ana María" });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("muestra el nombre, la información de contacto y la hora local", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 14, 14, 32));
    renderModal();

    expect(screen.getByRole("heading", { name: "Ana Pérez" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Información de contacto" })).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByText(/02:32.*hora local/)).toBeInTheDocument();
  });

  it("abre el formulario con el nombre actual al pulsar Editar y deja el foco en el nombre", async () => {
    const { user } = renderModal();

    await user.click(screen.getByRole("button", { name: "Editar" }));

    expect(screen.getByRole("dialog", { name: "Editar perfil" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Ana Pérez");
    expect(screen.getByLabelText("Nombre")).toHaveFocus();
  });

  it("vuelve a la vista al cancelar sin guardar", async () => {
    const { user } = renderModal();

    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByRole("dialog", { name: "Tu perfil" })).toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("guarda el nombre nuevo, actualiza el usuario y vuelve a la vista", async () => {
    const { user } = renderModal();

    await user.click(screen.getByRole("button", { name: "Editar" }));
    const nameField = screen.getByLabelText("Nombre");
    await user.clear(nameField);
    await user.type(nameField, "  Ana María ");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update.mock.calls[0][0].get("name")).toBe("Ana María");
    expect(mocks.updateUser).toHaveBeenCalledWith({ ...ana, name: "Ana María" });
    expect(await screen.findByRole("dialog", { name: "Tu perfil" })).toBeInTheDocument();
    expect(screen.getByText("Perfil actualizado.")).toBeInTheDocument();
  });

  it("no guarda un nombre vacío y muestra el error", async () => {
    const { user } = renderModal();

    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.clear(screen.getByLabelText("Nombre"));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(screen.getByText("Ingresá tu nombre.")).toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("cierra la sesión y el modal al pulsar Cerrar sesión", async () => {
    const { user, onClose } = renderModal();

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mocks.logout).toHaveBeenCalledTimes(1);
  });

  it("se cierra con la X y con Escape", async () => {
    const { user, onClose } = renderModal();

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
