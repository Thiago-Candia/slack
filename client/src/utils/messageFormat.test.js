import { describe, expect, it } from "vitest";
import { applyFormat, parseInline, parseMessage } from "./messageFormat";
import source from "./messageFormat.js?raw";

describe("parseInline", () => {
  it("devuelve texto plano sin marcas", () => {
    expect(parseInline("hola equipo")).toEqual([{ type: "text", value: "hola equipo" }]);
  });

  it("reconoce negrita, cursiva y código", () => {
    expect(parseInline("a *b* _c_ `d`")).toEqual([
      { type: "text", value: "a " },
      { type: "bold", children: [{ type: "text", value: "b" }] },
      { type: "text", value: " " },
      { type: "italic", children: [{ type: "text", value: "c" }] },
      { type: "text", value: " " },
      { type: "code", value: "d" }
    ]);
  });

  it("permite anidar cursiva dentro de negrita", () => {
    expect(parseInline("*hola _mundo_*")).toEqual([
      {
        type: "bold",
        children: [
          { type: "text", value: "hola " },
          { type: "italic", children: [{ type: "text", value: "mundo" }] }
        ]
      }
    ]);
  });

  it("no interpreta marcas dentro de código", () => {
    expect(parseInline("`*no*`")).toEqual([{ type: "code", value: "*no*" }]);
  });

  it("no aplica cursiva a guiones bajos dentro de una palabra", () => {
    expect(parseInline("usar snake_case_name")).toEqual([{ type: "text", value: "usar snake_case_name" }]);
  });

  it("deja el texto tal cual si la marca no se cierra", () => {
    expect(parseInline("2 * 3 = 6")).toEqual([{ type: "text", value: "2 * 3 = 6" }]);
  });

  it("reconoce enlaces http y https", () => {
    expect(parseInline("ver [la guía](https://example.com/a?b=1)")).toEqual([
      { type: "text", value: "ver " },
      { type: "link", href: "https://example.com/a?b=1", label: "la guía" }
    ]);
  });

  it("no crea enlaces con otros protocolos", () => {
    expect(parseInline("[x](javascript:alert(1))")).toEqual([{ type: "text", value: "[x](javascript:alert(1))" }]);
  });

  it("no cambia una cuenta con asteriscos separados por espacios", () => {
    expect(parseInline("2 * 3 * 4 = 24")).toEqual([{ type: "text", value: "2 * 3 * 4 = 24" }]);
  });

  it("no aplica formato si la marca queda pegada a un espacio interior", () => {
    expect(parseInline("_ hola _ y * chau *")).toEqual([{ type: "text", value: "_ hola _ y * chau *" }]);
  });

  it("no interpreta marcas dentro de una URL suelta", () => {
    expect(parseInline("mirá http://ej.com/_algo_/x y *esto*")).toEqual([
      { type: "text", value: "mirá http://ej.com/_algo_/x y " },
      { type: "bold", children: [{ type: "text", value: "esto" }] }
    ]);
  });

  it("acepta paréntesis balanceados dentro de la URL de un enlace", () => {
    expect(parseInline("[wiki](https://es.wikipedia.org/wiki/Slack_(software))")).toEqual([
      { type: "link", href: "https://es.wikipedia.org/wiki/Slack_(software)", label: "wiki" }
    ]);
  });

  it("no abre formato con la marca pegada a una letra o duplicada", () => {
    expect(parseInline("a*b* y **c**")).toEqual([{ type: "text", value: "a*b* y **c**" }]);
  });

  it("aplica formato después de un bloque de código", () => {
    expect(parseInline("`x`, *y*")).toEqual([
      { type: "code", value: "x" },
      { type: "text", value: ", " },
      { type: "bold", children: [{ type: "text", value: "y" }] }
    ]);
  });

  it("acepta una marca de un solo carácter", () => {
    expect(parseInline("*a*")).toEqual([{ type: "bold", children: [{ type: "text", value: "a" }] }]);
  });
});

describe("expresión del formato", () => {
  it("no usa lookbehind, que Safari anterior a 16.4 no soporta", () => {
    expect(source).not.toMatch(/\(\?<[!=]/);
  });
});

describe("parseMessage", () => {
  it("agrupa las líneas consecutivas en un párrafo", () => {
    expect(parseMessage("uno\ndos")).toEqual([{ type: "paragraph", children: [{ type: "text", value: "uno\ndos" }] }]);
  });

  it("agrupa los ítems consecutivos en una sola lista", () => {
    const blocks = parseMessage("pendientes\n- a\n- *b*\nfin");

    expect(blocks.map((block) => block.type)).toEqual(["paragraph", "list", "paragraph"]);
    expect(blocks[1].items).toHaveLength(2);
    expect(blocks[1].items[1]).toEqual([{ type: "bold", children: [{ type: "text", value: "b" }] }]);
  });

  it("acepta saltos de línea de Windows", () => {
    expect(parseMessage("- a\r\n- b")[0].items).toHaveLength(2);
  });

  it("devuelve una lista vacía sin texto", () => {
    expect(parseMessage("")).toEqual([]);
    expect(parseMessage(null)).toEqual([]);
  });
});

describe("applyFormat", () => {
  it("envuelve la selección en negrita", () => {
    expect(applyFormat("bold", "hola mundo", 0, 4)).toEqual({ value: "*hola* mundo", start: 1, end: 5 });
  });

  it("deja el cursor entre las marcas cuando no hay selección", () => {
    expect(applyFormat("code", "ab", 1, 1)).toEqual({ value: "a``b", start: 2, end: 2 });
  });

  it("aplica cursiva", () => {
    expect(applyFormat("italic", "hola", 0, 4).value).toBe("_hola_");
  });

  it("arma un enlace con el texto seleccionado y selecciona la URL", () => {
    const result = applyFormat("link", "ver guía", 4, 8);

    expect(result.value).toBe("ver [guía](https://)");
    expect(result.value.slice(result.start, result.end)).toBe("https://");
  });

  it("arma un enlace con texto de ejemplo cuando no hay selección", () => {
    expect(applyFormat("link", "", 0, 0).value).toBe("[texto](https://)");
  });

  it("agrega el prefijo de lista a la línea actual", () => {
    expect(applyFormat("list", "uno\ndos", 5, 5).value).toBe("uno\n- dos");
  });

  it("agrega el prefijo a todas las líneas seleccionadas", () => {
    expect(applyFormat("list", "uno\ndos\ntres", 0, 7).value).toBe("- uno\n- dos\ntres");
  });

  it("no agrega un ítem vacío si la selección termina en un salto de línea", () => {
    expect(applyFormat("list", "uno\ndos\n", 0, 8).value).toBe("- uno\n- dos\n");
    expect(applyFormat("list", "uno\ndos\ntres", 0, 8).value).toBe("- uno\n- dos\ntres");
  });

  it("quita el prefijo si todas las líneas ya son ítems", () => {
    expect(applyFormat("list", "- uno\n- dos", 0, 11).value).toBe("uno\ndos");
  });

  it("devuelve el texto sin cambios con un tipo desconocido", () => {
    expect(applyFormat("otro", "hola", 0, 4)).toEqual({ value: "hola", start: 0, end: 4 });
  });
});
