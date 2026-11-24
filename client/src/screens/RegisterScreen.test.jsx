import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../App";
import { AuthProvider } from "../context/AuthContext";
import { TOKEN_KEY } from "../services/session";
import { jsonResponse } from "../test/jsonResponse";

const ana = { id: 1, name: "Ana Pérez", email: "ana@example.com", avatar_url: null };

const mockApi = ({ profileFails = false } = {}) =>
  vi.spyOn(globalThis, "fetch").mockImplementation((url, options = {}) => {
    if (url.endsWith("/register")) return jsonResponse({ token: "nuevo-token", user: ana }, 201);
    if (url.endsWith("/profile") && options.method === "PATCH") {
      return profileFails ? jsonResponse({ errors: ["No se pudo guardar"] }, 422) : jsonResponse(ana);
    }
    if (url.endsWith("/profile")) return jsonResponse(ana);
    if (url.endsWith("/workspaces")) return jsonResponse([]);
    return jsonResponse({ errors: ["Recurso no encontrado"] }, 404);
  });

const renderRegister = () =>
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );

const fillForm = async (user) => {
  await user.type(screen.getByLabelText("Nombre"), "Ana Pérez");
  await user.type(screen.getByLabelText("Email"), "ana@example.com");
  await user.type(screen.getByLabelText("Contraseña"), "password123");
  await user.type(screen.getByLabelText("Repetir contraseña"), "password123");
};

const profileUpdates = (fetchMock) =>
  fetchMock.mock.calls.filter(([url, options]) => url.endsWith("/profile") && options?.method === "PATCH");

describe("RegisterScreen", () => {
  it("ofrece una imagen de perfil opcional", () => {
    mockApi();
    renderRegister();

    expect(screen.getByLabelText("Imagen de perfil (opcional)")).toBeInTheDocument();
  });

  it("muestra la fortaleza de la contraseña mientras se escribe", async () => {
    mockApi();
    renderRegister();

    await userEvent.setup().type(screen.getByLabelText("Contraseña"), "abc");

    expect(screen.getByText("Fortaleza: Débil")).toBeInTheDocument();
  });

  it("crea la cuenta sin imagen y no actualiza el perfil", async () => {
    const fetchMock = mockApi();
    const user = userEvent.setup();
    renderRegister();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByRole("heading", { name: /tus espacios de trabajo/i })).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBe("nuevo-token");
    expect(profileUpdates(fetchMock)).toHaveLength(0);
  });

  it("sube la imagen elegida con el perfil después de crear la cuenta", async () => {
    const fetchMock = mockApi();
    const user = userEvent.setup();
    renderRegister();

    await fillForm(user);
    await user.upload(screen.getByLabelText("Imagen de perfil (opcional)"), new File(["x"], "foto.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByRole("heading", { name: /tus espacios de trabajo/i })).toBeInTheDocument();

    const [[, options]] = profileUpdates(fetchMock);
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("avatar").name).toBe("foto.png");
    expect(options.headers.Authorization).toBe("Bearer nuevo-token");
  });

  it("entra igual si falla la subida de la imagen", async () => {
    mockApi({ profileFails: true });
    const user = userEvent.setup();
    renderRegister();

    await fillForm(user);
    await user.upload(screen.getByLabelText("Imagen de perfil (opcional)"), new File(["x"], "foto.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByRole("heading", { name: /tus espacios de trabajo/i })).toBeInTheDocument();
  });

  it("rechaza un archivo que no es una imagen", async () => {
    mockApi();
    const user = userEvent.setup({ applyAccept: false });
    renderRegister();

    await user.upload(screen.getByLabelText("Imagen de perfil (opcional)"), new File(["x"], "nota.txt", { type: "text/plain" }));

    expect(screen.getByText("El archivo tiene que ser una imagen.")).toBeInTheDocument();
  });
});
