import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../api";

const TIPOS = [
  { value: "VACACIONES", label: "Vacaciones" },
  { value: "PERMISO", label: "Permiso" },
  { value: "LICENCIA_MEDICA", label: "Licencia médica" },
  { value: "FALTA", label: "Falta" },
  { value: "OTRO", label: "Otro" }
] as const;

function labelTipo(codigo: string): string {
  return TIPOS.find((t) => t.value === codigo)?.label ?? codigo;
}

type EmpleadoOpt = { idEmpleado: number; nombre: string; apellido: string };

type IncidenciaRow = {
  idIncidencia: number;
  idEmpleado: number;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  descripcion: string | null;
  empleado?: { idEmpleado: number; nombre: string; apellido: string; email: string };
};

type Draft = {
  idIncidencia: number;
  idEmpleado: number;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  descripcion: string;
};

export function IncidenciasPage() {
  const [empleados, setEmpleados] = useState<EmpleadoOpt[]>([]);
  const [rows, setRows] = useState<IncidenciaRow[]>([]);
  const [filtroEmp, setFiltroEmp] = useState("");

  const [idEmp, setIdEmp] = useState("");
  const [tipo, setTipo] = useState("VACACIONES");
  const [fi, setFi] = useState("");
  const [ff, setFf] = useState("");
  const [desc, setDesc] = useState("");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadEmpleados = useCallback(async (): Promise<void> => {
    const e = await api<EmpleadoOpt[]>("/empleados");
    setEmpleados(Array.isArray(e) ? e : []);
  }, []);

  const loadIncidencias = useCallback(async (): Promise<void> => {
    const q =
      filtroEmp.trim() !== "" ? `/incidencias?idEmpleado=${encodeURIComponent(filtroEmp)}` : "/incidencias";
    const list = await api<IncidenciaRow[]>(q);
    setRows(Array.isArray(list) ? list : []);
  }, [filtroEmp]);

  useEffect(() => {
    void (async () => {
      try {
        await loadEmpleados();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    })();
  }, [loadEmpleados]);

  useEffect(() => {
    void (async () => {
      try {
        await loadIncidencias();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    })();
  }, [loadIncidencias]);

  const crear = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!idEmp || !fi || !ff) return;
    setBusy(true);
    try {
      await api("/incidencias", {
        method: "POST",
        body: JSON.stringify({
          idEmpleado: Number(idEmp),
          tipo,
          fechaInicio: fi,
          fechaFin: ff,
          descripcion: desc.trim() || undefined
        })
      });
      setDesc("");
      setFf("");
      setFi("");
      setIdEmp("");
      setTipo("VACACIONES");
      await loadIncidencias();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const guardar = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    try {
      await api(`/incidencias/${draft.idIncidencia}`, {
        method: "PUT",
        body: JSON.stringify({
          tipo: draft.tipo,
          fechaInicio: draft.fechaInicio,
          fechaFin: draft.fechaFin,
          descripcion: draft.descripcion.trim() || null
        })
      });
      setDraft(null);
      await loadIncidencias();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const eliminar = async (id: number): Promise<void> => {
    if (!window.confirm("¿Eliminar esta incidencia?")) return;
    setBusy(true);
    try {
      await api(`/incidencias/${id}`, { method: "DELETE" });
      await loadIncidencias();
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
          <h1>Incidencias</h1>
          <p className="muted">Registre vacaciones, permisos, licencias médicas y otras incidencias por empleado.</p>
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}

      <div className="grid grid-2" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Nueva incidencia</h2>
          {empleados.length === 0 ? (
            <p className="muted">No hay empleados registrados.</p>
          ) : (
            <form onSubmit={(e) => void crear(e)}>
              <div className="field">
                <label>Empleado *</label>
                <select required value={idEmp} onChange={(e) => setIdEmp(e.target.value)}>
                  <option value="">Seleccione…</option>
                  {empleados.map((emp) => (
                    <option key={emp.idEmpleado} value={emp.idEmpleado}>
                      {emp.apellido}, {emp.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Tipo *</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Desde *</label>
                <input type="date" required value={fi} onChange={(e) => setFi(e.target.value)} />
              </div>
              <div className="field">
                <label>Hasta *</label>
                <input type="date" required value={ff} onChange={(e) => setFf(e.target.value)} />
              </div>
              <div className="field">
                <label>Notas / detalle</label>
                <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
              <button type="submit" disabled={busy}>
                Registrar
              </button>
            </form>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Filtro</h2>
          <div className="field">
            <label htmlFor="filtro-inc-emp">Ver incidencias del empleado</label>
            <select id="filtro-inc-emp" value={filtroEmp} onChange={(e) => setFiltroEmp(e.target.value)}>
              <option value="">Todos los empleados</option>
              {empleados.map((emp) => (
                <option key={emp.idEmpleado} value={emp.idEmpleado}>
                  {emp.apellido}, {emp.nombre}
                </option>
              ))}
            </select>
          </div>
          <p className="muted" style={{ marginBottom: 0, fontSize: "0.9rem" }}>
            Los empleados ven sus incidencias en el expediente. Aquí gestiona el catálogo de ausencias y licencias.
          </p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Listado</h2>
        {rows.length === 0 ? (
          <p className="muted">No hay registros{filtroEmp ? " para este filtro" : ""}.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Tipo</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Notas</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) =>
                  draft?.idIncidencia === r.idIncidencia ? (
                    <tr key={r.idIncidencia}>
                      <td colSpan={6} style={{ padding: "0.75rem", background: "var(--surface)" }}>
                        <form onSubmit={(e) => void guardar(e)} className="grid grid-2">
                          <div className="field" style={{ gridColumn: "1 / -1" }}>
                            <label>Tipo *</label>
                            <select value={draft.tipo} onChange={(e) => setDraft({ ...draft, tipo: e.target.value })}>
                              {TIPOS.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>Desde *</label>
                            <input
                              type="date"
                              required
                              value={draft.fechaInicio.slice(0, 10)}
                              onChange={(e) => setDraft({ ...draft, fechaInicio: e.target.value })}
                            />
                          </div>
                          <div className="field">
                            <label>Hasta *</label>
                            <input
                              type="date"
                              required
                              value={draft.fechaFin.slice(0, 10)}
                              onChange={(e) => setDraft({ ...draft, fechaFin: e.target.value })}
                            />
                          </div>
                          <div className="field" style={{ gridColumn: "1 / -1" }}>
                            <label>Notas</label>
                            <textarea
                              rows={2}
                              value={draft.descripcion}
                              onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })}
                            />
                          </div>
                          <div className="row-actions" style={{ gridColumn: "1 / -1" }}>
                            <button type="submit" disabled={busy}>
                              Guardar
                            </button>
                            <button type="button" className="secondary" disabled={busy} onClick={() => setDraft(null)}>
                              Cancelar
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.idIncidencia}>
                      <td>
                        {r.empleado
                          ? `${r.empleado.apellido}, ${r.empleado.nombre}`
                          : `Empleado #${r.idEmpleado}`}
                      </td>
                      <td>
                        <span className="pill">{labelTipo(r.tipo)}</span>
                      </td>
                      <td>{r.fechaInicio.slice(0, 10)}</td>
                      <td>{r.fechaFin.slice(0, 10)}</td>
                      <td className="muted" style={{ maxWidth: "14rem" }}>
                        {r.descripcion ?? "—"}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="secondary"
                            disabled={busy}
                            onClick={() =>
                              setDraft({
                                idIncidencia: r.idIncidencia,
                                idEmpleado: r.idEmpleado,
                                tipo: r.tipo,
                                fechaInicio: r.fechaInicio.slice(0, 10),
                                fechaFin: r.fechaFin.slice(0, 10),
                                descripcion: r.descripcion ?? ""
                              })
                            }
                          >
                            Editar
                          </button>
                          <button type="button" className="secondary" disabled={busy} onClick={() => void eliminar(r.idIncidencia)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
