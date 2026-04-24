import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, getSessionUser } from "../api";

const INCIDENCIA_TIPO_LABEL: Record<string, string> = {
  VACACIONES: "Vacaciones",
  PERMISO: "Permiso",
  LICENCIA_MEDICA: "Licencia médica",
  FALTA: "Falta",
  OTRO: "Otro"
};

function incidenciaTipoLabel(tipo: string): string {
  return INCIDENCIA_TIPO_LABEL[tipo] ?? tipo;
}

type Expediente = {
  idEmpleado: number;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  telefono: string | null;
  fechaIngreso: string;
  salarioBase: string | number;
  estado: string;
  departamento?: { nombre: string };
  puesto?: { nombre: string };
  asistencias: Array<{ idAsistencia: number; fecha: string; horaEntrada: string | null; horaSalida: string | null; estado: string }>;
  incidencias: Array<{ idIncidencia: number; tipo: string; fechaInicio: string; fechaFin: string; descripcion: string | null }>;
  historialesCapacitacion: Array<{
    idHistorial: number;
    fechaInicio: string;
    fechaFin: string | null;
    estado: string;
    calificacion: string | number | null;
    curso: { nombre: string; duracionHoras: number };
  }>;
};

export function ExpedientePage() {
  const { id } = useParams();
  const [data, setData] = useState<Expediente | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setData(null);
    if (!id) return;
    const session = getSessionUser();
    if (session?.rol === "EMPLEADO" && Number(id) !== session.idEmpleado) {
      setError("No puede ver expedientes de otros empleados.");
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const row = await api<Expediente>(`/empleados/${id}/expediente`);
        if (alive) setData(row);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (error) {
    return (
      <div>
        <p className="error">{error}</p>
        <Link to={getSessionUser()?.rol === "EMPLEADO" ? "/mi-expediente" : "/empleados"}>Volver</Link>
      </div>
    );
  }
  if (!data) {
    return <p className="muted">Cargando expediente…</p>;
  }

  const volverHref = getSessionUser()?.rol === "EMPLEADO" ? "/mi-expediente" : "/empleados";
  const volverLabel = getSessionUser()?.rol === "EMPLEADO" ? "Mi inicio" : "Volver al listado";

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>
            {data.nombre} {data.apellido}
          </h1>
          <p className="muted">Expediente · cédula {data.cedula}</p>
        </div>
        <Link className="btn secondary" to={volverHref}>
          {volverLabel}
        </Link>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Datos generales</h2>
          <p>
            <span className="muted">Email:</span> {data.email}
          </p>
          <p>
            <span className="muted">Teléfono:</span> {data.telefono ?? "—"}
          </p>
          <p>
            <span className="muted">Ingreso:</span> {data.fechaIngreso.slice(0, 10)}
          </p>
          <p>
            <span className="muted">Departamento:</span> {data.departamento?.nombre ?? "—"}
          </p>
          <p>
            <span className="muted">Puesto:</span> {data.puesto?.nombre ?? "—"}
          </p>
          <p>
            <span className="muted">Salario base:</span> {String(data.salarioBase)}
          </p>
          <p>
            <span className="muted">Estado:</span> <span className="pill">{data.estado}</span>
          </p>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Capacitación</h2>
          {data.historialesCapacitacion.length === 0 ? (
            <p className="muted">Sin registros.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.historialesCapacitacion.map((h) => (
                  <tr key={h.idHistorial}>
                    <td>
                      {h.curso.nombre}{" "}
                      <span className="muted">({h.curso.duracionHoras}h)</span>
                    </td>
                    <td>{h.fechaInicio.slice(0, 10)}</td>
                    <td>{h.fechaFin ? h.fechaFin.slice(0, 10) : "—"}</td>
                    <td>{h.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid" style={{ marginTop: "1rem" }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Asistencias recientes</h2>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.asistencias.map((a) => (
                <tr key={a.idAsistencia}>
                  <td>{a.fecha.slice(0, 10)}</td>
                  <td>{a.horaEntrada ?? "—"}</td>
                  <td>{a.horaSalida ?? "—"}</td>
                  <td>{a.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Incidencias</h2>
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Desde</th>
                <th>Hasta</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {data.incidencias.map((i) => (
                <tr key={i.idIncidencia}>
                  <td>{incidenciaTipoLabel(i.tipo)}</td>
                  <td>{i.fechaInicio.slice(0, 10)}</td>
                  <td>{i.fechaFin.slice(0, 10)}</td>
                  <td>{i.descripcion ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
