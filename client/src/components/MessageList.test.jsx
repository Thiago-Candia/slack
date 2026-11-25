import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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
    // Los separadores no cuentan como mensajes para los lectores de pantalla.
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

  describe("adjuntos", () => {
    const photo = {
      id: 10,
      filename: "foto.png",
      content_type: "image/png",
      byte_size: 2048,
      url: "/rails/active_storage/blobs/redirect/abc/foto.png",
      download_url: "/rails/active_storage/blobs/redirect/abc/foto.png?disposition=attachment"
    };
    const report = {
      id: 11,
      filename: "informe.pdf",
      content_type: "application/pdf",
      byte_size: 3 * 1024 * 1024,
      url: "/rails/active_storage/blobs/redirect/def/informe.pdf",
      download_url: "/rails/active_storage/blobs/redirect/def/informe.pdf?disposition=attachment"
    };
    const withAttachments = (body, attachments) => ({ ...message(1, body, bruno, at(14, 9)), attachments });

    it("muestra las imágenes en la conversación con un enlace para abrirlas", () => {
      render(<MessageList status="ready" messages={[withAttachments("Mirá", [photo])]} />);

      const image = screen.getByRole("img", { name: "foto.png" });
      expect(image.getAttribute("src")).toMatch(/\/rails\/active_storage\/blobs\/redirect\/abc\/foto\.png$/);
      expect(image.closest("a")).toHaveAttribute("target", "_blank");
      expect(image.closest("a")).toHaveAttribute("rel", expect.stringContaining("noopener"));
    });

    it("muestra el resto de los archivos como enlace de descarga con nombre y tamaño", () => {
      render(<MessageList status="ready" messages={[withAttachments("Te paso el informe", [report])]} />);

      const link = screen.getByRole("link", { name: /informe\.pdf/ });
      expect(link).toHaveTextContent("3 MB");
      expect(link).toHaveTextContent("Descargar");
      expect(link.getAttribute("href")).toMatch(/disposition=attachment$/);
      expect(screen.queryByRole("img", { name: "informe.pdf" })).not.toBeInTheDocument();
    });

    it("un mensaje solo con adjuntos no muestra un cuerpo vacío", () => {
      const { container } = render(<MessageList status="ready" messages={[withAttachments("", [report])]} />);

      expect(container.querySelector(".message__body")).not.toBeInTheDocument();
      expect(screen.getByText("informe.pdf")).toBeInTheDocument();
    });

    it("los mensajes sin el campo attachments se siguen mostrando", () => {
      const { container } = render(<MessageList status="ready" messages={[message(1, "Viejo", bruno, at(14, 9))]} />);

      expect(screen.getByText("Viejo")).toBeInTheDocument();
      expect(container.querySelector(".message-attachments")).not.toBeInTheDocument();
    });

    it("vuelve al final cuando carga una imagen si la persona estaba leyendo lo último", () => {
      const scrollIntoView = vi.fn();
      const original = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = scrollIntoView;

      try {
        render(<MessageList status="ready" messages={[withAttachments("Mirá", [photo])]} />);
        scrollIntoView.mockClear();

        fireEvent.load(screen.getByRole("img", { name: "foto.png" }));
        expect(scrollIntoView).toHaveBeenCalledTimes(1);

        // Si subió a leer mensajes anteriores, la carga de una imagen no la mueve.
        const log = screen.getByRole("log");
        Object.defineProperties(log, {
          scrollHeight: { configurable: true, value: 2000 },
          clientHeight: { configurable: true, value: 500 },
          scrollTop: { configurable: true, value: 100 }
        });
        fireEvent.scroll(log);
        scrollIntoView.mockClear();

        fireEvent.load(screen.getByRole("img", { name: "foto.png" }));
        expect(scrollIntoView).not.toHaveBeenCalled();
      } finally {
        Element.prototype.scrollIntoView = original;
      }
    });
  });

  it("muestra el estado vacío con su ícono", () => {
    const { container } = render(<MessageList status="ready" messages={[]} />);

    expect(screen.getByText("Todavía no hay mensajes.")).toBeInTheDocument();
    expect(container.querySelector(".conversation-empty__icon svg")).toBeInTheDocument();
  });
});
