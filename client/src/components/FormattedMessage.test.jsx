import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FormattedMessage from "./FormattedMessage";

describe("FormattedMessage", () => {
  it("muestra negrita, cursiva y código con su elemento", () => {
    const { container } = render(<FormattedMessage text="*fuerte* _suave_ `código`" />);

    expect(container.querySelector("strong")).toHaveTextContent("fuerte");
    expect(container.querySelector("em")).toHaveTextContent("suave");
    expect(container.querySelector("code")).toHaveTextContent("código");
  });

  it("muestra los enlaces válidos abriendo en otra pestaña sin pasar el origen", () => {
    render(<FormattedMessage text="[guía](https://example.com)" />);

    const link = screen.getByRole("link", { name: "guía" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("no crea enlaces con javascript: y los muestra como texto", () => {
    render(<FormattedMessage text="[x](javascript:alert(1))" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("[x](javascript:alert(1))")).toBeInTheDocument();
  });

  it("muestra el HTML escrito por la persona como texto", () => {
    const { container } = render(<FormattedMessage text="<script>alert(1)</script> <b>no</b>" />);

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(screen.getByText("<script>alert(1)</script> <b>no</b>")).toBeInTheDocument();
  });

  it("muestra las listas con un ítem por línea", () => {
    render(<FormattedMessage text={"pendientes\n- uno\n- dos"} />);

    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["uno", "dos"]);
  });

  it("sigue mostrando un mensaje de texto plano", () => {
    render(<FormattedMessage text="Hola equipo" />);

    expect(screen.getByText("Hola equipo")).toBeInTheDocument();
  });
});
