import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import MessageList from "./MessageList";

vi.mock("../context/WorkspaceContext", () => ({
  useWorkspaces: () => ({ user: { id: 1, name: "Ana Pérez" } })
}));

const ana = { id: 1, name: "Ana Pérez", avatar_url: null };
const bruno = { id: 2, name: "Bruno Díaz", avatar_url: null };
const at = (day, hour, minute = 0) => new Date(2026, 9, day, hour, minute).toISOString();
const message = (id, body, sender, createdAt) => ({ id, body, sender, created_at: createdAt });

describe("MessageList", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 14, 18, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra Vos en los mensajes propios y el nombre en los ajenos", () => {
    render(
      <MessageList
        status="ready"
        messages={[message(1, "Hola equipo", ana, at(14, 9)), message(2, "Dale, me sumo", bruno, at(14, 10))]}
      />
    );

    expect(screen.getByText("Vos")).toBeInTheDocument();
    expect(screen.getByText("Bruno Díaz")).toBeInTheDocument();
    expect(screen.queryByText("Ana Pérez")).not.toBeInTheDocument();
  });

  it("agrega un separador cuando cambia el día", () => {
    render(
      <MessageList
        status="ready"
        messages={[
          message(1, "Ayer a la tarde", bruno, at(13, 17)),
          message(2, "Hoy a la mañana", bruno, at(14, 9)),
          message(3, "Hoy más tarde", bruno, at(14, 9, 2))
        ]}
      />
    );

    const separators = document.querySelectorAll(".message-day");

    expect([...separators].map((item) => item.textContent)).toEqual(["Ayer", "Hoy"]);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("vuelve a mostrar el autor al cambiar de día aunque sea la misma persona", () => {
    render(
      <MessageList
        status="ready"
        messages={[message(1, "Tarde", bruno, at(13, 23, 59)), message(2, "Temprano", bruno, at(14, 0, 1))]}
      />
    );

    expect(screen.getAllByText("Bruno Díaz")).toHaveLength(2);
  });

  it("agrupa los mensajes seguidos de la misma persona", () => {
    render(
      <MessageList
        status="ready"
        messages={[message(1, "Uno", bruno, at(14, 9)), message(2, "Dos", bruno, at(14, 9, 2))]}
      />
    );

    expect(screen.getAllByText("Bruno Díaz")).toHaveLength(1);
  });

  it("muestra solo la hora en cada mensaje", () => {
    render(<MessageList status="ready" messages={[message(1, "Hola", bruno, at(2, 17, 5))]} />);

    const meta = screen.getByText("Bruno Díaz").closest("p");

    expect(within(meta).getByText(/^\d{2}:\d{2}/)).toBeInTheDocument();
    expect(meta).not.toHaveTextContent(/oct/i);
  });

  it("muestra el estado vacío con su ícono", () => {
    const { container } = render(<MessageList status="ready" messages={[]} />);

    expect(screen.getByText("Todavía no hay mensajes.")).toBeInTheDocument();
    expect(container.querySelector(".conversation-empty__icon svg")).toBeInTheDocument();
  });
});
