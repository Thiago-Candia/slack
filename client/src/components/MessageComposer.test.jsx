import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
    expect(screen.getByRole("button", { name: "Adjuntar archivo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enviar mensaje" })).toBeDisabled();
  });
});

describe("MessageComposer con adjuntos", () => {
  const file = (name, size = 2048) => {
    const result = new File(["x"], name);
    Object.defineProperty(result, "size", { value: size });
    return result;
  };

  const setupWithFiles = (props = {}) => {
    const onSend = props.onSend ?? vi.fn().mockResolvedValue({});
    // applyAccept: false para poder probar la validación propia con tipos no permitidos.
    const user = userEvent.setup({ applyAccept: false });
    render(<MessageComposer placeholder="Escribe un mensaje" {...props} onSend={onSend} />);

    return { user, onSend, textarea: screen.getByLabelText("Mensaje"), input: screen.getByTestId("composer-file-input") };
  };

  it("el botón Adjuntar archivo abre el selector", async () => {
    const { user, input } = setupWithFiles();
    const click = vi.spyOn(input, "click");

    await user.click(screen.getByRole("button", { name: "Adjuntar archivo" }));

    expect(click).toHaveBeenCalled();
    expect(input).toHaveAttribute("multiple");
    expect(input.getAttribute("accept")).toContain(".pdf");
  });

  it("muestra los archivos elegidos con nombre y tamaño", async () => {
    const { user, input } = setupWithFiles();

    await user.upload(input, [file("foto.png"), file("informe.pdf", 3 * 1024 * 1024)]);

    const list = screen.getByRole("list", { name: "Archivos para enviar" });
    expect(within(list).getByText("foto.png")).toBeInTheDocument();
    expect(within(list).getByText("2 KB")).toBeInTheDocument();
    expect(within(list).getByText("3 MB")).toBeInTheDocument();
  });

  it("permite quitar un archivo", async () => {
    const { user, input } = setupWithFiles();

    await user.upload(input, [file("foto.png"), file("informe.pdf")]);
    await user.click(screen.getByRole("button", { name: "Quitar foto.png" }));

    expect(screen.queryByText("foto.png")).not.toBeInTheDocument();
    expect(screen.getByText("informe.pdf")).toBeInTheDocument();
  });

  it("envía solo con archivos y limpia la selección", async () => {
    const { user, input, onSend } = setupWithFiles();
    const photo = file("foto.png");

    await user.upload(input, photo);
    const send = screen.getByRole("button", { name: "Enviar mensaje" });
    expect(send).toBeEnabled();
    await user.click(send);

    expect(onSend).toHaveBeenCalledWith("", [photo]);
    expect(screen.queryByRole("list", { name: "Archivos para enviar" })).not.toBeInTheDocument();
  });

  it("envía texto y archivos juntos con Enter", async () => {
    const { user, input, onSend, textarea } = setupWithFiles();
    const report = file("informe.pdf");

    await user.upload(input, report);
    await user.type(textarea, "Te paso el informe{Enter}");

    expect(onSend).toHaveBeenCalledWith("Te paso el informe", [report]);
    expect(textarea).toHaveValue("");
  });

  it("no agrega archivos fuera de las reglas y explica el motivo", async () => {
    const { user, input } = setupWithFiles();

    await user.upload(input, [file("dibujo.svg"), file("enorme.pdf", 11 * 1024 * 1024)]);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("«dibujo.svg» no es de un tipo permitido");
    expect(alert).toHaveTextContent("«enorme.pdf» supera los 10 MB.");
    expect(screen.queryByRole("list", { name: "Archivos para enviar" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar mensaje" })).toBeDisabled();
  });

  it("no deja adjuntar más de cinco archivos", async () => {
    const { user, input } = setupWithFiles();

    await user.upload(input, ["1", "2", "3", "4", "5", "6"].map((name) => file(`${name}.txt`)));

    expect(within(screen.getByRole("list", { name: "Archivos para enviar" })).getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("alert")).toHaveTextContent("Podés adjuntar hasta 5 archivos por mensaje.");
  });

  it("si falla el envío conserva el texto y los archivos", async () => {
    const onSend = vi.fn().mockRejectedValue(new Error("Archivos adjuntos no pueden superar los 10 MB (foto.png)"));
    const { user, input, textarea } = setupWithFiles({ onSend });

    await user.upload(input, file("foto.png"));
    await user.type(textarea, "Mirá{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("Archivos adjuntos no pueden superar los 10 MB");
    expect(textarea).toHaveValue("Mirá");
    expect(screen.getByText("foto.png")).toBeInTheDocument();
  });
});
