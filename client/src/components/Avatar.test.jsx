import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { avatarColor } from "../utils/format";
import Avatar from "./Avatar";

describe("Avatar", () => {
  it("muestra las iniciales con el color derivado del nombre", () => {
    const { container } = render(<Avatar name="Ana Pérez" />);
    const { background, color } = avatarColor("Ana Pérez");

    expect(container.firstChild).toHaveTextContent("AP");
    expect(container.firstChild).toHaveStyle({ backgroundColor: background, color });
  });

  it("usa el mismo color cada vez que se muestra el mismo nombre", () => {
    const { container } = render(
      <>
        <Avatar name="Bruno Díaz" />
        <Avatar name="Bruno Díaz" />
      </>
    );

    expect(container.children[0].getAttribute("style")).toBe(container.children[1].getAttribute("style"));
  });

  it("es redondo por defecto y acepta la forma cuadrada", () => {
    const { container } = render(
      <>
        <Avatar name="Ana" />
        <Avatar name="Ana" shape="square" />
      </>
    );

    expect(container.children[0]).toHaveClass("avatar--round");
    expect(container.children[1]).toHaveClass("avatar--square");
  });

  it("muestra la imagen sin color de fondo cuando hay foto", () => {
    const { container } = render(<Avatar name="Ana" src="blob:http://localhost/foto" />);

    expect(container.querySelector("img")).toBeInTheDocument();
    expect(container.querySelector(".avatar--initials")).toBeNull();
  });

  it("se anuncia con su nombre cuando no es decorativo", () => {
    render(<Avatar name="Ana Pérez" decorative={false} />);

    expect(screen.getByRole("img", { name: "Ana Pérez" })).toBeInTheDocument();
  });
});
