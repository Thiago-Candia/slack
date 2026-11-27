import { describe, expect, it } from "vitest";
import { MAX_FILE_SIZE, addFiles, fileError, formatFileSize, isImageAttachment } from "./attachments";

const file = (name, size = 10, type = "") => {
  const result = new File(["x"], name, { type });
  Object.defineProperty(result, "size", { value: size });
  return result;
};

describe("fileError", () => {
  it("acepta los tipos permitidos sin importar mayúsculas", () => {
    ["foto.PNG", "foto.jpeg", "informe.pdf", "datos.csv", "notas.txt", "planilla.xlsx", "paquete.zip"].forEach((name) => {
      expect(fileError(file(name))).toBeNull();
    });
  });

  it("valida por extensión aunque el navegador informe otro tipo", () => {
    expect(fileError(file("datos.csv", 10, "application/vnd.ms-excel"))).toBeNull();
  });

  it("rechaza tipos no permitidos", () => {
    expect(fileError(file("dibujo.svg"))).toMatch(/«dibujo\.svg» no es de un tipo permitido/);
    expect(fileError(file("pagina.html"))).toMatch(/no es de un tipo permitido/);
    expect(fileError(file("sin-extension"))).toMatch(/no es de un tipo permitido/);
  });

  it("rechaza archivos de más de 10 MB y acepta el límite exacto", () => {
    expect(fileError(file("grande.pdf", MAX_FILE_SIZE + 1))).toBe("«grande.pdf» supera los 10 MB.");
    expect(fileError(file("justo.pdf", MAX_FILE_SIZE))).toBeNull();
  });
});

describe("addFiles", () => {
  it("suma los archivos válidos y devuelve los motivos de los rechazados", () => {
    const valid = file("a.png");
    const result = addFiles([], [valid, file("b.exe")]);

    expect(result.files).toEqual([valid]);
    expect(result.errors).toEqual([expect.stringMatching(/«b\.exe»/)]);
  });

  it("no pasa de cinco archivos", () => {
    const current = ["1", "2", "3", "4"].map((name) => file(`${name}.txt`));
    const result = addFiles(current, [file("5.txt"), file("6.txt"), file("7.txt")]);

    expect(result.files).toHaveLength(5);
    expect(result.errors).toEqual(["Podés adjuntar hasta 5 archivos por mensaje."]);
  });
});

describe("formatFileSize", () => {
  it("muestra el tamaño en la unidad adecuada", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1,5 KB");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(250 * 1024)).toBe("250 KB");
    expect(formatFileSize(10 * 1024 * 1024)).toBe("10 MB");
    expect(formatFileSize(undefined)).toBe("");
  });
});

describe("isImageAttachment", () => {
  it("reconoce las imágenes que se pueden mostrar", () => {
    expect(isImageAttachment({ content_type: "image/png" })).toBe(true);
    expect(isImageAttachment({ content_type: "application/pdf" })).toBe(false);
    expect(isImageAttachment({ content_type: "image/svg+xml" })).toBe(false);
  });
});
