import { useCallback, useEffect, useState } from "react";
import { api, getSessionUser } from "../api";

type Asistencia = {
  idAsistencia: number;
  idEmpleado: number;
  fecha: string;
  horaEntrada: string | null;
  horaSalida: string | null;
  estado: string;
};

function localDateISO(): string {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

function nowHHMM(): string {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, "0");
  return `${z(d.getHours())}:${z(d.getMinutes())}`;
}

export function MiAsistenciaPage() {
  const session = getSessionUser();
  const idEmpleado = session?.idEmpleado;

  const [rows, setRows] = useState<Asistencia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    if (idEmpleado == null) return;
    const list = await api<Asistencia[]>(`/asistencias/empleado/${idEmpleado}`);
    setRows(Array.isArray(list) ? list : []);
    setError(null);
  }, [idEmpleado]);

  useEffect(() => {
    if (idEmpleado == null) return;
    void (async () => {
      try {
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    })();
  }, [idEmpleado, load]);

  const hoy = localDateISO();
  const registroHoy = rows.find((r) => r.fecha.slice(0, 10) === hoy) ?? null;

  const marcarEntrada = async (estado: "NORMAL" | "RETARDO"): Promise<void> => {
    if (idEmpleado == null) return;
    setError(null);
    setBusy(true);
    try {
      await api("/asistencias", {
        method: "POST",
        body: JSON.stringify({
          fecha: hoy,
          horaEntrada: nowHHMM(),
          estado
        })
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const marcarSalida = async (): Promise<void> => {
    if (!registroHoy) return;
    setError(null);
    setBusy(true);
    try {
      await api(`/asistencias/${registroHoy.idAsistencia}`, {
        method: "PUT",
        body: JSON.stringify({ horaSalida: nowHHMM() })
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const completarEntrada = async (): Promise<void> => {
    if (!registroHoy) return;
    setError(null);
    setBusy(true);
    try {
      await api(`/asistencias/${registroHoy.idAsistencia}`, {
        method: "PUT",
        body: JSON.stringify({ horaEntrada: nowHHMM() })
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  if (idEmpleado == null) {
    return <p className="muted">No se encontró el empleado asociado a su sesión.</p>;
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Mi asistencia</h1>
          <p className="muted">Registre su entrada y salida del día. Fecha de hoy: {hoy}</p>
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Hoy</h2>
        {!registroHoy ? (
          <div>
            <p className="muted" style={{ marginBottom: "0.75rem" }}>
              Aún no hay registro para hoy. Marque su hora de entrada.
            </p>
            <div className="row-actions">
              <button type="button" disabled={busy} onClick={() => void marcarEntrada("NORMAL")}>
                Marcar entrada
              </button>
              <button type="button" className="secondary" disabled={busy} onClick={() => void marcarEntrada("RETARDO")}>
                Entrada con retardo
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p>
              <span className="muted">Entrada:</span> {registroHoy.horaEntrada ?? "—"} ·{" "}
              <span className="muted">Salida:</span> {registroHoy.horaSalida ?? "—"} ·{" "}
              <span className="muted">Estado:</span> <span className="pill">{registroHoy.estado}</span>
            </p>
            {!registroHoy.horaEntrada ? (
              <button type="button" disabled={busy} onClick={() => void completarEntrada()}>
                Registrar hora de entrada
              </button>
            ) : !registroHoy.horaSalida ? (
              <button type="button" disabled={busy} onClick={() => void marcarSalida()}>
                Marcar salida
              </button>
            ) : (
              <p className="muted" style={{ marginBottom: 0 }}>
                Ya registró entrada y salida para hoy.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Historial reciente</h2>
        {rows.length === 0 ? (
          <p className="muted">Sin registros.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
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
                {rows.slice(0, 40).map((a) => (
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
        )}
      </div>
    </div>
  );
}
