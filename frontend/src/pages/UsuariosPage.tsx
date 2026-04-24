import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";

type EmpleadoOpt = { idEmpleado: number; nombre: string; apellido: string; email: string };
type UsuarioRow = {
  idUsuario: number;
  usuario: string;
  rol: string;
  idEmpleado: number;
  empleado: { nombre: string; apellido: string; email: string };
};

export function UsuariosPage() {
  const [rows, setRows] = useState<UsuarioRow[]>([]);
  const [emps, setEmps] = useState<EmpleadoOpt[]>([]);
  const [idEmpleado, setIdEmpleado] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("EMPLEADO");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (): Promise<void> => {
    const [u, e] = await Promise.all([api<UsuarioRow[]>("/usuarios"), api<EmpleadoOpt[]>("/empleados")]);
    setRows(u);
    setEmps(e);
  };

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, []);

  const crear = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/usuarios", {
        method: "POST",
        body: JSON.stringify({
          idEmpleado: Number(idEmpleado),
          usuario: usuario.trim(),
          password,
          rol
        })
      });
      setUsuario("");
      setPassword("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const eliminar = async (id: number): Promise<void> => {
    if (!confirm("¿Eliminar este usuario del sistema?")) return;
    setBusy(true);
    try {
      await api(`/usuarios/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Usuarios del sistema</h1>
          <p className="muted">Solo el rol administrador gestiona inicios de sesión.</p>
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Nuevo usuario</h2>
        <form onSubmit={(e) => void crear(e)} className="grid grid-2">
          <div className="field">
            <label>Empleado (expediente vinculado)</label>
            <select required value={idEmpleado} onChange={(e) => setIdEmpleado(e.target.value)}>
              <option value="">Seleccione…</option>
              {emps.map((x) => (
                <option key={x.idEmpleado} value={x.idEmpleado}>
                  {x.nombre} {x.apellido} — {x.email}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Nombre de usuario</label>
            <input required value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="off" />
          </div>
          <div className="field">
            <label>Contraseña inicial</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="field">
            <label>Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="EMPLEADO">EMPLEADO</option>
              <option value="RRHH">RRHH</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="field" style={{ alignSelf: "end" }}>
            <button type="submit" disabled={busy}>
              Crear
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Empleado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.idUsuario}>
                <td>{r.usuario}</td>
                <td>{r.rol}</td>
                <td>
                  {r.empleado.nombre} {r.empleado.apellido}
                </td>
                <td>
                  <button type="button" className="secondary" disabled={busy} onClick={() => void eliminar(r.idUsuario)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
