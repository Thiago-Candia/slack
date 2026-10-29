import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServerError } from "../utils/errors";
import Conversation from "./Conversation";

const ana = { id: 1, name: "Ana Pérez", email: "ana@example.com", avatar_url: null };
const bruno = { id: 2, name: "Bruno Díaz", email: "bruno@example.com", avatar_url: null };

const message = (id, body, sender = ana) => ({ id, body, created_at: "2026-10-14T12:00:00Z", sender });

const renderConversation = ({ loadMessages, sendMessage }) =>
  render(
    <Conversation
      title="# general"
      placeholder="Escribe un mensaje en #general"
      loadMessages={loadMessages}
      sendMessage={sendMessage}
    />
  );

describe("Conversation", () => {
  it("muestra el historial de mensajes con su remitente", async () => {
    renderConversation({
      loadMessages: () => Promise.resolve([message(1, "Hola equipo"), message(2, "Dale, me sumo", bruno)]),
      sendMessage: vi.fn()
    });

    expect(await screen.findByText("Hola equipo")).toBeInTheDocument();
    expect(screen.getByText("Dale, me sumo")).toBeInTheDocument();
    expect(screen.getByText("Bruno Díaz")).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay mensajes", async () => {
    renderConversation({ loadMessages: () => Promise.resolve([]), sendMessage: vi.fn() });

    expect(await screen.findByText(/todavía no hay mensajes/i)).toBeInTheDocument();
  });

  it("envía un mensaje, lo agrega una sola vez y limpia el campo", async () => {
    const sendMessage = vi.fn((body) => Promise.resolve(message(3, body)));
    renderConversation({ loadMessages: () => Promise.resolve([message(1, "Hola equipo")]), sendMessage });
    const user = userEvent.setup();
    await screen.findByText("Hola equipo");

    const input = screen.getByRole("textbox", { name: /mensaje/i });
    await user.type(input, "  Nuevo mensaje  ");
    await user.click(screen.getByRole("button", { name: /enviar/i }));

    expect(sendMessage).toHaveBeenCalledWith("Nuevo mensaje");
    expect(await screen.findByText("Nuevo mensaje")).toBeInTheDocument();
    expect(screen.getAllByText("Nuevo mensaje")).toHaveLength(1);
    expect(input).toHaveValue("");
  });

  it("no envía mensajes vacíos", async () => {
    const sendMessage = vi.fn();
    renderConversation({ loadMessages: () => Promise.resolve([]), sendMessage });
    await screen.findByText(/todavía no hay mensajes/i);

    expect(screen.getByRole("button", { name: /enviar/i })).toBeDisabled();
  });

  it("si falla la carga muestra el error y permite reintentar", async () => {
    const loadMessages = vi
      .fn()
      .mockRejectedValueOnce(new ServerError("No se pudo conectar con el servidor.", 0))
      .mockResolvedValueOnce([message(1, "Hola equipo")]);
    renderConversation({ loadMessages, sendMessage: vi.fn() });
    const user = userEvent.setup();

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo conectar con el servidor.");

    await user.click(screen.getByRole("button", { name: /reintentar/i }));

    expect(await screen.findByText("Hola equipo")).toBeInTheDocument();
    expect(loadMessages).toHaveBeenCalledTimes(2);
  });

  it("si falla el envío muestra el error de la API y conserva el texto", async () => {
    const sendMessage = vi.fn(() => Promise.reject(new ServerError("Mensaje no puede estar en blanco", 422)));
    renderConversation({ loadMessages: () => Promise.resolve([]), sendMessage });
    const user = userEvent.setup();
    await screen.findByText(/todavía no hay mensajes/i);

    const input = screen.getByRole("textbox", { name: /mensaje/i });
    await user.type(input, "Hola");
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("Mensaje no puede estar en blanco");
    expect(input).toHaveValue("Hola");
  });
});
