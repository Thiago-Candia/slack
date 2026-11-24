import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InviteModal from "./InviteModal";

const mocks = vi.hoisted(() => ({ createInvite: vi.fn() }));

vi.mock("../../services", () => ({ workspaceService: { createInvite: mocks.createInvite } }));

const workspace = { id: 3, name: "Cátedra Programación IV" };
const inviteLink = () => `${window.location.origin}/join/tok123`;

const setup = ({ fakeTimers = false } = {}) => {
  mocks.createInvite.mockResolvedValue({ invite_token: "tok123" });
  if (fakeTimers) vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup(fakeTimers ? { advanceTimers: vi.advanceTimersByTime } : {});
  render(<InviteModal workspace={workspace} onClose={vi.fn()} />);

  return user;
};

describe("InviteModal", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("empieza con el botón para generar el link y sin caja de link", () => {
    setup();

    expect(screen.getByRole("button", { name: "Generar link de invitación" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Link de invitación")).not.toBeInTheDocument();
  });

  it("muestra el link generado en una caja de solo lectura con el botón Copiar", async () => {
    const user = setup();

    await user.click(screen.getByRole("button", { name: "Generar link de invitación" }));

    expect(mocks.createInvite).toHaveBeenCalledWith(3);
    expect(await screen.findByLabelText("Link de invitación")).toHaveValue(inviteLink());
    expect(screen.getByLabelText("Link de invitación")).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Copiar" })).toBeInTheDocument();
  });

  it("copia el link, cambia el botón a Copiado y lo vuelve a Copiar después", async () => {
    const user = setup({ fakeTimers: true });

    await user.click(screen.getByRole("button", { name: "Generar link de invitación" }));
    await user.click(await screen.findByRole("button", { name: "Copiar" }));

    expect(await navigator.clipboard.readText()).toBe(inviteLink());
    expect(screen.getByRole("button", { name: "Copiado" })).toBeInTheDocument();
    expect(screen.getByText("Link copiado al portapapeles.")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByRole("button", { name: "Copiar" })).toBeInTheDocument();
  });

  it("avisa si no se pudo copiar automáticamente", async () => {
    const user = setup();

    await user.click(screen.getByRole("button", { name: "Generar link de invitación" }));
    const copyButton = await screen.findByRole("button", { name: "Copiar" });
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denegado"));
    await user.click(copyButton);

    const notice = await screen.findByText(/no se pudo copiar automáticamente/i);
    expect(notice).toBeInTheDocument();
    // Es una indicación, no un éxito: no usa el estilo verde.
    expect(notice).not.toHaveClass("form-success");
    expect(screen.getByRole("button", { name: "Copiar" })).toBeInTheDocument();
  });
});
