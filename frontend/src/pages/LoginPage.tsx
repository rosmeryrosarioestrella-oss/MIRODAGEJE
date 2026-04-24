import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken, setSessionUser, type SessionUser } from "../api";
import { AppFooter } from "../components/AppFooter";

export function LoginPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("admin");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<{ token: string; usuario: SessionUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ usuario, password })
      });
      setToken(data.token);
      setSessionUser(data.usuario);
      const dest = data.usuario.rol === "EMPLEADO" ? "/mi-expediente" : "/empleados";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap login-wrap--with-footer">
      <div className="card login-card">
        <div className="login-card-brand">
          <img src="/branding/logo-full.png" alt="MIRODAGEJE — Gestión de recursos humanos" />
        </div>
        <h1 style={{ marginTop: 0, fontSize: "1.25rem" }}>Acceso</h1>
        <p className="muted">Capital humano y nómina</p>
        <form onSubmit={(e) => void onSubmit(e)}>
          <div className="field">
            <label htmlFor="usuario">Usuario</label>
            <input
              id="usuario"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <div className="error">{error}</div> : null}
          <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "0.5rem" }}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
      <AppFooter />
    </div>
  );
}
