import { useEffect, useState, type FormEvent } from "react";
import { api, getSessionUser } from "../api";

type Curso = {
  idCurso: number;
  nombre: string;
  descripcion: string | null;
  duracionHoras: number;
};

type EmpleadoOpt = { idEmpleado: number; nombre: string; apellido: string; email: string };

type HistorialRow = {
  idHistorial: number;
  idEmpleado: number;
  idCurso: number;
  fechaInicio: string;
  fechaFin: string | null;
  estado: string;
  calificacion: string | number | null;
  curso: Curso;
  empleado?: { idEmpleado: number; nombre: string; apellido: string; email: string };
};

export function CapacitacionesPage() {
  // --- ESTADO GLOBAL Y DATOS DE LA API ---
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [historial, setHistorial] = useState<HistorialRow[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoOpt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // --- ESTADO DE FORMULARIOS (Nuevo Curso) ---
  const [cn, setCn] = useState("");
  const [cd, setCd] = useState("");
  const [ch, setCh] = useState("8");

  // --- ESTADO DE FORMULARIOS (Asignación/Historial) ---
  const [filtroEmp, setFiltroEmp] = useState("");
  const [hEmp, setHEmp] = useState("");
  const [hCurso, setHCurso] = useState("");
  const [hIni, setHIni] = useState("");
  const [hFin, setHFin] = useState("");
  const [hEstado, setHEstado] = useState("PROGRAMADO");
  const [hCal, setHCal] = useState("");

  /**
   * Carga solamente y exclusivamente el catálogo de cursos disponibles.
   */
  const loadCursos = async (): Promise<void> => {
    const c = await api<Curso[]>("/capacitacion/cursos");
    setCursos(c);
  };

  const refresh = async (): Promise<void> => {
    const session = getSessionUser();
    if (!session) return;
    const staff = session.rol === "ADMIN" || session.rol === "RRHH";
    try {
      const c = await api<Curso[]>("/capacitacion/cursos");
      setCursos(c);
      if (staff) {
        const q = filtroEmp ? `?idEmpleado=${encodeURIComponent(filtroEmp)}` : "";
        const h = await api<HistorialRow[]>(`/capacitacion/historial${q}`);
        setHistorial(h);
        const e = await api<EmpleadoOpt[]>("/empleados");
        setEmpleados(e);
      } else {
        const h = await api<HistorialRow[]>(`/capacitacion/historial/${session.idEmpleado}`);
        setHistorial(h);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar al cambiar filtro (solo RRHH/ADMIN)
  }, [filtroEmp]);

  const addCurso = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!cn.trim()) return;
    setBusy(true);
    try {
      await api("/capacitacion/cursos", {
        method: "POST",
        body: JSON.stringify({
          nombre: cn.trim(),
          descripcion: cd.trim() || undefined,
          duracionHoras: Number(ch) || 0
        })
      });
      setCn("");
      setCd("");
      setCh("8");
      await loadCursos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const addHistorial = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!hEmp || !hCurso || !hIni) return;
    setBusy(true);
    try {
      await api("/capacitacion/historial", {
        method: "POST",
        body: JSON.stringify({
          idEmpleado: Number(hEmp),
          idCurso: Number(hCurso),
          fechaInicio: hIni,
          fechaFin: hFin || null,
          estado: hEstado,
          calificacion: hCal === "" ? null : Number(hCal)
        })
      });
      setHFin("");
      setHCal("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  // Variables auxiliares de renderizado para simplificar el JSX
  const session = getSessionUser();
  const esStaff = session?.rol === "ADMIN" || session?.rol === "RRHH";

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Capacitaciones</h1>
          <p className="muted">
            {esStaff
              ? "Cursos y asignación de capacitación por empleado."
              : "Cursos en los que participa y su historial."}
          </p>
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}

      {/* BLOQUE 1: CATÁLOGO DE CURSOS (Lectura para todos, Escritura para Staff) */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Catálogo de cursos</h2>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Horas</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map((c) => (
                <tr key={c.idCurso}>
                  <td>{c.nombre}</td>
                  <td>{c.duracionHoras}</td>
                  <td className="muted">{c.descripcion ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BLOQUE 2: SEGUIMIENTO / HISTORIAL (Filtrado por permisos) */}
        {esStaff ? (
          <form onSubmit={(e) => void addCurso(e)} className="grid grid-2" style={{ marginTop: "1rem" }}>
            <div className="field">
              <label>Nombre del curso</label>
              <input value={cn} onChange={(e) => setCn(e.target.value)} />
            </div>
            <div className="field">
              <label>Duración (horas)</label>
              <input type="number" min={0} value={ch} onChange={(e) => setCh(e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Descripción</label>
              <input value={cd} onChange={(e) => setCd(e.target.value)} />
            </div>
            <div className="field">
              <button type="submit" disabled={busy}>
                Añadir curso
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>{esStaff ? "Historial por empleado" : "Mi historial"}</h2>

        {esStaff ? (
          <div className="field" style={{ maxWidth: "320px" }}>
            <label>Filtrar por empleado</label>
            <select value={filtroEmp} onChange={(e) => setFiltroEmp(e.target.value)}>
              <option value="">Todos</option>
              {empleados.map((x) => (
                <option key={x.idEmpleado} value={String(x.idEmpleado)}>
                  {x.nombre} {x.apellido}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Registro de una nueva instancia de capacitación */}
        {esStaff ? (
          <form onSubmit={(e) => void addHistorial(e)} className="grid grid-2" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <div className="field">
              <label>Empleado</label>
              <select required value={hEmp} onChange={(e) => setHEmp(e.target.value)}>
                <option value="">Seleccione…</option>
                {empleados.map((x) => (
                  <option key={x.idEmpleado} value={x.idEmpleado}>
                    {x.nombre} {x.apellido}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Curso</label>
              <select required value={hCurso} onChange={(e) => setHCurso(e.target.value)}>
                <option value="">Seleccione…</option>
                {cursos.map((c) => (
                  <option key={c.idCurso} value={c.idCurso}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Fecha inicio</label>
              <input type="date" required value={hIni} onChange={(e) => setHIni(e.target.value)} />
            </div>
            <div className="field">
              <label>Fecha fin (opcional)</label>
              <input type="date" value={hFin} onChange={(e) => setHFin(e.target.value)} />
            </div>
            <div className="field">
              <label>Estado</label>
              <input value={hEstado} onChange={(e) => setHEstado(e.target.value)} />
            </div>
            <div className="field">
              <label>Calificación (opcional)</label>
              <input type="number" step="0.01" value={hCal} onChange={(e) => setHCal(e.target.value)} />
            </div>
            <div className="field">
              <button type="submit" disabled={busy}>
                Registrar capacitación
              </button>
            </div>
          </form>
        ) : null}

        {/* Listado del historial */}
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                {esStaff ? <th>Empleado</th> : null}
                <th>Curso</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((h) => (
                <tr key={h.idHistorial}>
                  {esStaff ? (
                    <td>
                      {h.empleado
                        ? `${h.empleado.nombre} ${h.empleado.apellido}`
                        : `#${h.idEmpleado}`}
                    </td>
                  ) : null}
                  <td>{h.curso.nombre}</td>
                  <td>{h.fechaInicio.slice(0, 10)}</td>
                  <td>{h.fechaFin ? h.fechaFin.slice(0, 10) : "—"}</td>
                  <td>{h.estado}</td>
                  <td>{h.calificacion != null ? String(h.calificacion) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
