import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessageComposer from "./MessageComposer";

const setup = (props = {}) => {
  const onSend = vi.fn().mockResolvedValue({});
  const user = userEvent.setup();
  render(<MessageComposer placeholder="Escribe un mensaje" onSend={onSend} {...props} />);

  return { user, onSend, textarea: screen.getByLabelText("Mensaje") };
};

describe("MessageComposer", () => {
  it("muestra los cinco botones de formato", () => {
    setup();

    ["Negrita", "Cursiva", "Enlace", "Lista", "Código"].forEach((name) => {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    });
  });

  it("envuelve el texto seleccionado al usar un botón", async () => {
    const { user, textarea } = setup();

    await user.type(textarea, "hola mundo");
    textarea.setSelectionRange(0, 4);
    await user.click(screen.getByRole("button", { name: "Negrita" }));

    expect(textarea).toHaveValue("*hola* mundo");
    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([1, 5]);
  });

  it("deja el cursor entre las marcas cuando no hay selección", async () => {
    const { user, textarea } = setup();

    await user.click(screen.getByRole("button", { name: "Código" }));

    expect(textarea).toHaveValue("``");
    expect(textarea.selectionStart).toBe(1);
  });

  it("agrega el prefijo de lista", async () => {
    const { user, textarea } = setup();

    await user.type(textarea, "uno");
    await user.click(screen.getByRole("button", { name: "Lista" }));

    expect(textarea).toHaveValue("- uno");
  });

  it("aplica negrita con Ctrl+B", async () => {
    const { user, textarea } = setup();

    await user.type(textarea, "hola");
    textarea.setSelectionRange(0, 4);
    await user.keyboard("{Control>}b{/Control}");

    expect(textarea).toHaveValue("*hola*");
  });

  it("envía el mensaje con Enter y limpia el campo", async () => {
    const { user, onSend, textarea } = setup();

    await user.type(textarea, "hola{Enter}");

    expect(onSend).toHaveBeenCalledWith("hola");
    expect(textarea).toHaveValue("");
  });

  it("no envía con Shift+Enter", async () => {
    const { user, onSend, textarea } = setup();

    await user.type(textarea, "uno{Shift>}{Enter}{/Shift}dos");

    expect(onSend).not.toHaveBeenCalled();
    expect(textarea).toHaveValue("uno\ndos");
  });

  it("deshabilita la barra cuando el compositor está deshabilitado", () => {
    setup({ disabled: true });

    expect(screen.getByRole("button", { name: "Negrita" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enviar mensaje" })).toBeDisabled();
  });
});
