import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../api";

type TipoBonificacion = {
  idTipoBonificacion: number;
  nombre: string;
  descripcion: string | null;
  activo: string;
};

type Asignacion = {
  idAsignacion: number;
  idTipoBonificacion: number;
  idEmpleado: number;
  monto: string | number;
  fecha: string;
  notas: string | null;
  tipoBonificacion: { idTipoBonificacion: number; nombre: string; activo: string };
  empleado: { idEmpleado: number; nombre: string; apellido: string; email: string };
};

type EmpleadoOpt = { idEmpleado: number; nombre: string; apellido: string };

type TipoDraft = { idTipoBonificacion: number; nombre: string; descripcion: string; activo: string };
type AsigDraft = {
  idAsignacion: number;
  idEmpleado: number;
  idTipoBonificacion: number;
  monto: string;
  fecha: string;
  notas: string;
};

function money(n: string | number): string {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("es-VE", { style: "currency", currency: "USD" }).format(v);
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function BonificacionesPage() {
  const [tipos, setTipos] = useState<TipoBonificacion[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoOpt[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [filtroEmpleado, setFiltroEmpleado] = useState("");

  const [ntNombre, setNtNombre] = useState("");
  const [ntDesc, setNtDesc] = useState("");

  const [naEmp, setNaEmp] = useState("");
  const [naTipo, setNaTipo] = useState("");
  const [naMonto, setNaMonto] = useState("");
  const [naFecha, setNaFecha] = useState(todayISO);
  const [naNotas, setNaNotas] = useState("");

  const [tipoDraft, setTipoDraft] = useState<TipoDraft | null>(null);
  const [asigDraft, setAsigDraft] = useState<AsigDraft | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadTiposYEmpleados = useCallback(async (): Promise<void> => {
    const [t, e] = await Promise.all([
      api<TipoBonificacion[]>("/bonificaciones/tipos"),
      api<EmpleadoOpt[]>("/empleados")
    ]);
    setTipos(Array.isArray(t) ? t : []);
    setEmpleados(Array.isArray(e) ? e : []);
  }, []);

  const loadAsignaciones = useCallback(async (): Promise<void> => {
    const q =
      filtroEmpleado.trim() !== ""
        ? `/bonificaciones/asignaciones?idEmpleado=${encodeURIComponent(filtroEmpleado)}`
        : "/bonificaciones/asignaciones";
    const a = await api<Asignacion[]>(q);
    setAsignaciones(Array.isArray(a) ? a : []);
  }, [filtroEmpleado]);

  useEffect(() => {
    void (async () => {
      try {
        await loadTiposYEmpleados();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    })();
  }, [loadTiposYEmpleados]);

  useEffect(() => {
    void (async () => {
      try {
        await loadAsignaciones();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    })();
  }, [filtroEmpleado, loadAsignaciones]);

  const addTipo = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!ntNombre.trim()) return;
    setBusy(true);
    try {
      await api("/bonificaciones/tipos", {
        method: "POST",
        body: JSON.stringify({ nombre: ntNombre.trim(), descripcion: ntDesc.trim() || undefined })
      });
      setNtNombre("");
      setNtDesc("");
      await loadTiposYEmpleados();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const saveTipo = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!tipoDraft?.nombre.trim()) return;
    setBusy(true);
    try {
      await api(`/bonificaciones/tipos/${tipoDraft.idTipoBonificacion}`, {
        method: "PUT",
        body: JSON.stringify({
          nombre: tipoDraft.nombre.trim(),
          descripcion: tipoDraft.descripcion.trim() || null,
          activo: tipoDraft.activo
        })
      });
      setTipoDraft(null);
      await loadTiposYEmpleados();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const delTipo = async (id: number): Promise<void> => {
    if (!window.confirm("¿Eliminar este tipo de bonificación?")) return;
    setBusy(true);
    try {
      await api(`/bonificaciones/tipos/${id}`, { method: "DELETE" });
      await loadTiposYEmpleados();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const addAsignacion = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!naEmp || !naTipo || !naMonto.trim()) return;
    const m = Number(naMonto.replace(",", "."));
    if (Number.isNaN(m) || m <= 0) {
      setError("Indique un monto mayor a cero.");
      return;
    }
    setBusy(true);
    try {
      await api("/bonificaciones/asignaciones", {
        method: "POST",
        body: JSON.stringify({
          idEmpleado: Number(naEmp),
          idTipoBonificacion: Number(naTipo),
          monto: m,
          fecha: naFecha,
          notas: naNotas.trim() || undefined
        })
      });
      setNaMonto("");
      setNaNotas("");
      setNaFecha(todayISO());
      await loadAsignaciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const saveAsig = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!asigDraft) return;
    const m = Number(asigDraft.monto.replace(",", "."));
    if (Number.isNaN(m) || m <= 0) {
      setError("Monto inválido.");
      return;
    }
    setBusy(true);
    try {
      await api(`/bonificaciones/asignaciones/${asigDraft.idAsignacion}`, {
        method: "PUT",
        body: JSON.stringify({
          idEmpleado: asigDraft.idEmpleado,
          idTipoBonificacion: asigDraft.idTipoBonificacion,
          monto: m,
          fecha: asigDraft.fecha,
          notas: asigDraft.notas.trim() || null
        })
      });
      setAsigDraft(null);
      await loadAsignaciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const delAsig = async (id: number): Promise<void> => {
    if (!window.confirm("¿Eliminar esta asignación?")) return;
    setBusy(true);
    try {
      await api(`/bonificaciones/asignaciones/${id}`, { method: "DELETE" });
      await loadAsignaciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const tiposActivos = tipos.filter((t) => t.activo === "ACTIVO");
  const tiposParaEditarAsig = (draft: AsigDraft | null) =>
    tipos.filter((t) => t.activo === "ACTIVO" || (draft != null && t.idTipoBonificacion === draft.idTipoBonificacion));

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Bonificaciones</h1>
          <p className="muted">Defina tipos de bono y asígnelos a empleados con monto y fecha.</p>
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}

      <div className="grid grid-2" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Tipos de bonificación</h2>
          <form onSubmit={(e) => void addTipo(e)} className="field" style={{ marginBottom: "1rem" }}>
            <label>Nuevo tipo — nombre *</label>
            <div className="row-actions">
              <input
                style={{ flex: 1, minWidth: 0 }}
                placeholder="Ej. Productividad"
                value={ntNombre}
                onChange={(e) => setNtNombre(e.target.value)}
              />
              <button type="submit" disabled={busy}>
                Registrar
              </button>
            </div>
            <label style={{ marginTop: "0.5rem" }}>Descripción (opcional)</label>
            <input value={ntDesc} onChange={(e) => setNtDesc(e.target.value)} />
          </form>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {tipos.map((t) =>
              tipoDraft?.idTipoBonificacion === t.idTipoBonificacion ? (
                <form key={t.idTipoBonificacion} onSubmit={(e) => void saveTipo(e)} style={{ padding: "0.65rem", border: "1px solid var(--border)", borderRadius: 10 }}>
                  <div className="field">
                    <label>Nombre *</label>
                    <input
                      value={tipoDraft.nombre}
                      onChange={(e) => setTipoDraft({ ...tipoDraft, nombre: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Descripción</label>
                    <input
                      value={tipoDraft.descripcion}
                      onChange={(e) => setTipoDraft({ ...tipoDraft, descripcion: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Estado</label>
                    <select
                      value={tipoDraft.activo}
                      onChange={(e) => setTipoDraft({ ...tipoDraft, activo: e.target.value })}
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </div>
                  <div className="row-actions">
                    <button type="submit" disabled={busy}>
                      Guardar
                    </button>
                    <button type="button" className="secondary" disabled={busy} onClick={() => setTipoDraft(null)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  key={t.idTipoBonificacion}
                  className="row-actions"
                  style={{ justifyContent: "space-between", alignItems: "flex-start" }}
                >
                  <div className="muted" style={{ flex: 1 }}>
                    <strong>{t.nombre}</strong>
                    {t.activo !== "ACTIVO" ? (
                      <span className="pill" style={{ marginLeft: "0.35rem" }}>
                        {t.activo}
                      </span>
                    ) : null}
                    {t.descripcion ? <div style={{ fontSize: "0.9rem", marginTop: "0.2rem" }}>{t.descripcion}</div> : null}
                  </div>
                  <div className="row-actions" style={{ flexShrink: 0 }}>
                    <button
                      type="button"
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        setTipoDraft({
                          idTipoBonificacion: t.idTipoBonificacion,
                          nombre: t.nombre,
                          descripcion: t.descripcion ?? "",
                          activo: t.activo
                        })
                      }
                    >
                      Editar
                    </button>
                    <button type="button" className="secondary" disabled={busy} onClick={() => void delTipo(t.idTipoBonificacion)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Asignar a empleado</h2>
          {tiposActivos.length === 0 ? (
            <p className="muted">Registre al menos un tipo de bonificación ACTIVO.</p>
          ) : empleados.length === 0 ? (
            <p className="muted">No hay empleados en el sistema.</p>
          ) : (
            <form onSubmit={(e) => void addAsignacion(e)}>
              <div className="field">
                <label>Empleado *</label>
                <select required value={naEmp} onChange={(e) => setNaEmp(e.target.value)}>
                  <option value="">Seleccione…</option>
                  {empleados.map((emp) => (
                    <option key={emp.idEmpleado} value={emp.idEmpleado}>
                      {emp.apellido}, {emp.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Tipo de bono *</label>
                <select required value={naTipo} onChange={(e) => setNaTipo(e.target.value)}>
                  <option value="">Seleccione…</option>
                  {tiposActivos.map((t) => (
                    <option key={t.idTipoBonificacion} value={t.idTipoBonificacion}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Monto *</label>
                <input type="text" inputMode="decimal" placeholder="0.00" value={naMonto} onChange={(e) => setNaMonto(e.target.value)} />
              </div>
              <div className="field">
                <label>Fecha *</label>
                <input type="date" value={naFecha} onChange={(e) => setNaFecha(e.target.value)} />
              </div>
              <div className="field">
                <label>Notas (opcional)</label>
                <input value={naNotas} onChange={(e) => setNaNotas(e.target.value)} />
              </div>
              <button type="submit" disabled={busy}>
                Asignar bono
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="card">
        <div className="row-actions" style={{ justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Asignaciones</h2>
          <div className="field" style={{ margin: 0, minWidth: "12rem" }}>
            <label htmlFor="filtro-emp" style={{ fontSize: "0.75rem" }}>
              Filtrar por empleado
            </label>
            <select id="filtro-emp" value={filtroEmpleado} onChange={(e) => setFiltroEmpleado(e.target.value)}>
              <option value="">Todos</option>
              {empleados.map((emp) => (
                <option key={emp.idEmpleado} value={emp.idEmpleado}>
                  {emp.apellido}, {emp.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        {asignaciones.length === 0 ? (
          <p className="muted">No hay asignaciones{filtroEmpleado ? " para este empleado" : ""}.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Empleado</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Notas</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {asignaciones.map((a) =>
                  asigDraft?.idAsignacion === a.idAsignacion ? (
                    <tr key={a.idAsignacion}>
                      <td colSpan={6} style={{ padding: "0.75rem", background: "var(--surface)" }}>
                        <form onSubmit={(e) => void saveAsig(e)} className="grid grid-2">
                          <div className="field">
                            <label>Empleado</label>
                            <select
                              value={String(asigDraft.idEmpleado)}
                              onChange={(e) => setAsigDraft({ ...asigDraft, idEmpleado: Number(e.target.value) })}
                            >
                              {empleados.map((emp) => (
                                <option key={emp.idEmpleado} value={emp.idEmpleado}>
                                  {emp.apellido}, {emp.nombre}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>Tipo</label>
                            <select
                              value={String(asigDraft.idTipoBonificacion)}
                              onChange={(e) =>
                                setAsigDraft({ ...asigDraft, idTipoBonificacion: Number(e.target.value) })
                              }
                            >
                              {tiposParaEditarAsig(asigDraft).map((t) => (
                                <option key={t.idTipoBonificacion} value={t.idTipoBonificacion}>
                                  {t.nombre}
                                  {t.activo !== "ACTIVO" ? " (inactivo)" : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>Monto *</label>
                            <input
                              value={asigDraft.monto}
                              onChange={(e) => setAsigDraft({ ...asigDraft, monto: e.target.value })}
                            />
                          </div>
                          <div className="field">
                            <label>Fecha *</label>
                            <input
                              type="date"
                              value={asigDraft.fecha.slice(0, 10)}
                              onChange={(e) => setAsigDraft({ ...asigDraft, fecha: e.target.value })}
                            />
                          </div>
                          <div className="field" style={{ gridColumn: "1 / -1" }}>
                            <label>Notas</label>
                            <input
                              value={asigDraft.notas}
                              onChange={(e) => setAsigDraft({ ...asigDraft, notas: e.target.value })}
                            />
                          </div>
                          <div className="row-actions" style={{ gridColumn: "1 / -1" }}>
                            <button type="submit" disabled={busy}>
                              Guardar
                            </button>
                            <button type="button" className="secondary" disabled={busy} onClick={() => setAsigDraft(null)}>
                              Cancelar
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={a.idAsignacion}>
                      <td>{a.fecha.slice(0, 10)}</td>
                      <td>
                        {a.empleado.apellido}, {a.empleado.nombre}
                      </td>
                      <td>{a.tipoBonificacion.nombre}</td>
                      <td>{money(a.monto)}</td>
                      <td className="muted" style={{ maxWidth: "14rem" }}>
                        {a.notas ?? "—"}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="secondary"
                            disabled={busy}
                            onClick={() =>
                              setAsigDraft({
                                idAsignacion: a.idAsignacion,
                                idEmpleado: a.idEmpleado,
                                idTipoBonificacion: a.idTipoBonificacion,
                                monto: String(a.monto),
                                fecha: a.fecha.slice(0, 10),
                                notas: a.notas ?? ""
                              })
                            }
                          >
                            Editar
                          </button>
                          <button type="button" className="secondary" disabled={busy} onClick={() => void delAsig(a.idAsignacion)}>
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
