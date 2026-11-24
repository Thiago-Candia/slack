import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import HomeScreen from "./HomeScreen";

const mocks = vi.hoisted(() => ({ state: {} }));

vi.mock("../context/WorkspaceContext", () => ({
  useWorkspaces: () => mocks.state
}));

const ana = { id: 1, name: "Ana Pérez", email: "ana@example.com", avatar_url: null };
const member = (id) => ({ id, name: `Persona ${id}`, avatar_url: null });

const renderHome = (state) => {
  mocks.state = { user: ana, workspaces: [], status: "ready", error: null, reload: vi.fn(), ...state };

  return render(
    <MemoryRouter>
      <HomeScreen />
    </MemoryRouter>
  );
};

describe("HomeScreen", () => {
  beforeEach(() => {
    mocks.state = {};
  });

  it("muestra cada espacio de trabajo con su cantidad de miembros y un enlace para abrirlo", () => {
    renderHome({
      workspaces: [
        { id: 3, name: "Cátedra Programación IV", image_url: null, members: [member(1), member(2)] },
        { id: 4, name: "Equipo solitario", image_url: null, members: [member(1)] }
      ]
    });

    const cards = screen.getAllByRole("listitem").filter((item) => item.classList.contains("workspace-card"));

    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText("2 miembros")).toBeInTheDocument();
    expect(within(cards[1]).getByText("1 miembro")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir Cátedra Programación IV" })).toHaveAttribute("href", "/workspace/3");
  });

  it("muestra el estado vacío cuando no hay espacios de trabajo", () => {
    renderHome({ workspaces: [] });

    expect(screen.getByText("Todavía no pertenecés a ningún espacio de trabajo.")).toBeInTheDocument();
  });

  it("anuncia la carga de los espacios de trabajo", () => {
    renderHome({ status: "loading" });

    expect(screen.getByRole("status")).toHaveTextContent("Cargando espacios de trabajo...");
  });

  it("permite reintentar si falla la carga", async () => {
    const reload = vi.fn();
    renderHome({ status: "error", error: new Error("falló"), reload });

    await userEvent.setup().click(screen.getByRole("button", { name: "Reintentar" }));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("enlaza el bloque destacado a la creación de un espacio de trabajo", () => {
    renderHome();

    expect(screen.getByRole("link", { name: "Crear un espacio de trabajo" })).toHaveAttribute("href", "/new-workspace");
  });

  it("muestra las tres tarjetas de primeros pasos", () => {
    renderHome();

    const section = screen.getByRole("region", { name: "Primeros pasos" });

    expect(within(section).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Creá un canal",
      "Invitá a tu equipo",
      "Escribí a una persona"
    ]);
  });
});
