import { afterEach, describe, expect, it, vi } from "vitest";
import { jsonResponse } from "../test/jsonResponse";
import { channelService } from "./channel.service";
import { directMessageService } from "./directMessage.service";
import { messagePayload } from "./messagePayload";

describe("messagePayload", () => {
  it("sin archivos devuelve el JSON de siempre", () => {
    expect(messagePayload("Hola")).toEqual({ body: "Hola" });
    expect(messagePayload("Hola", [])).toEqual({ body: "Hola" });
  });

  it("con archivos arma un FormData con body y files[]", () => {
    const files = [new File(["a"], "a.png"), new File(["b"], "b.pdf")];
    const payload = messagePayload("", files);

    expect(payload).toBeInstanceOf(FormData);
    expect(payload.get("body")).toBe("");
    expect(payload.getAll("files[]").map((item) => item.name)).toEqual(["a.png", "b.pdf"]);
  });
});

describe("envío de mensajes con adjuntos", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("los canales y los mensajes directos mandan multipart sin Content-Type fijo", async () => {
    const fetchMock = vi.fn(() => jsonResponse({ id: 1 }, 201));
    vi.stubGlobal("fetch", fetchMock);
    const files = [new File(["a"], "a.png")];

    await channelService.sendMessage(3, "Hola", files);
    await directMessageService.sendMessage(1, 2, "", files);

    fetchMock.mock.calls.forEach(([url, options]) => {
      expect(options.body).toBeInstanceOf(FormData);
      expect(options.headers["Content-Type"]).toBeUndefined();
      expect(url).toMatch(/\/channels\/3\/messages$|\/workspaces\/1\/direct_messages\/2$/);
    });
  });

  it("sin archivos sigue mandando JSON", async () => {
    const fetchMock = vi.fn(() => jsonResponse({ id: 1 }, 201));
    vi.stubGlobal("fetch", fetchMock);

    await channelService.sendMessage(3, "Hola");

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.body).toBe(JSON.stringify({ body: "Hola" }));
  });
});
