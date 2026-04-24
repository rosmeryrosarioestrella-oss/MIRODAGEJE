const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

const SESSION_KEY = "mirodageje_session";

export type SessionUser = {
  idUsuario: number;
  usuario: string;
  rol: "ADMIN" | "RRHH" | "EMPLEADO";
  idEmpleado: number;
};

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export function getSessionUser(): SessionUser | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSessionUser(user: SessionUser | null): void {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

export function clearAuth(): void {
  setToken(null);
  setSessionUser(null);
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const t = getToken();
  if (t) headers.set("Authorization", `Bearer ${t}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      const preview = text.replace(/\s+/g, " ").slice(0, 180);
      throw new Error(
        preview ? `Respuesta no válida (${res.status}): ${preview}` : `Respuesta no válida (${res.status})`
      );
    }
  }
  if (!res.ok) {
    const body = data as { error?: string } | null;
    const msg = typeof body?.error === "string" ? body.error : res.statusText;
    throw new Error(msg || `Error HTTP ${res.status}`);
  }
  return data as T;
}
