import { describe, expect, it } from "vitest";
import { avatarColor, dayKey, dayLabel, formatMessageTime, initials } from "./format";

const local = (year, month, day, hour = 12) => new Date(year, month - 1, day, hour, 0).toISOString();
const now = new Date(2026, 9, 14, 18, 0);

describe("dayLabel", () => {
  it("devuelve Hoy para un mensaje del mismo día", () => {
    expect(dayLabel(local(2026, 10, 14, 8), now)).toBe("Hoy");
  });

  it("devuelve Ayer para un mensaje del día anterior", () => {
    expect(dayLabel(local(2026, 10, 13, 23), now)).toBe("Ayer");
  });

  it("devuelve día y mes para fechas anteriores del mismo año", () => {
    expect(dayLabel(local(2026, 10, 2), now)).toMatch(/^2 de octubre$/);
  });

  it("agrega el año cuando es de otro año", () => {
    expect(dayLabel(local(2025, 12, 31), now)).toMatch(/^31 de diciembre de 2025$/);
  });

  it("devuelve vacío con una fecha inválida", () => {
    expect(dayLabel("no es una fecha", now)).toBe("");
  });
});

describe("dayKey", () => {
  it("es igual para dos horas del mismo día y distinta entre días", () => {
    expect(dayKey(local(2026, 10, 14, 1))).toBe(dayKey(local(2026, 10, 14, 23)));
    expect(dayKey(local(2026, 10, 14))).not.toBe(dayKey(local(2026, 10, 13)));
  });

  it("devuelve vacío con una fecha inválida", () => {
    expect(dayKey("x")).toBe("");
  });
});

describe("formatMessageTime", () => {
  it("muestra solo la hora, sin la fecha", () => {
    expect(formatMessageTime(local(2026, 10, 2, 17))).toMatch(/^\d{2}:\d{2}/);
    expect(formatMessageTime(local(2026, 10, 2, 17))).not.toMatch(/oct/i);
  });

  it("devuelve vacío con una fecha inválida", () => {
    expect(formatMessageTime("x")).toBe("");
  });
});

describe("initials", () => {
  it("toma las dos primeras iniciales", () => {
    expect(initials("ana maría pérez")).toBe("AM");
  });

  it("devuelve un signo de pregunta sin nombre", () => {
    expect(initials("")).toBe("?");
  });
});

describe("avatarColor", () => {
  it("devuelve siempre el mismo color para el mismo nombre", () => {
    expect(avatarColor("Ana Pérez")).toEqual(avatarColor("Ana Pérez"));
  });

  it("no distingue mayúsculas ni espacios en los extremos", () => {
    expect(avatarColor("  ana pérez ")).toEqual(avatarColor("ANA PÉREZ"));
  });

  it("devuelve fondo y color de texto", () => {
    expect(avatarColor("Bruno Díaz")).toEqual({ background: expect.stringMatching(/^#/), color: expect.stringMatching(/^#/) });
  });

  it("reparte distintos nombres en más de un color", () => {
    const colors = new Set(["Ana", "Bruno", "Carla", "Diego", "Elena", "Facundo", "Gabriela", "Hugo"].map((name) => avatarColor(name).background));

    expect(colors.size).toBeGreaterThan(1);
  });

  it("no falla sin nombre", () => {
    expect(avatarColor()).toBeDefined();
  });
});
