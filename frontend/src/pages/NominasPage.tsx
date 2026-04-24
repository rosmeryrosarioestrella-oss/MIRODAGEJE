import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";

type Detalle = {
  idDetalle: number;
  salarioBase: string | number;
  bonificaciones: string | number;
  deducciones: string | number;
  salarioNeto: string | number;
  empleado: { nombre: string; apellido: string; idEmpleado: number };
};

type Nomina = {
  idNomina: number;
  fechaInicio: string;
  fechaFin: string;
  fechaPago: string;
  detalles: Detalle[];
};

export function NominasPage() {
  const [rows, setRows] = useState<Nomina[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fi, setFi] = useState("2026-04-01");
  const [ff, setFf] = useState("2026-04-30");
  const [fp, setFp] = useState("2026-04-30");
  const [isr, setIsr] = useState("10");
  const [imss, setImss] = useState("3.5");
  const [busy, setBusy] = useState(false);

  const load = async (): Promise<void> => {
    try {
      const data = await api<Nomina[]>("/nominas");
      setRows(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const crear = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    try {
      await api<Nomina>("/nominas", {
        method: "POST",
        body: JSON.stringify({ fechaInicio: fi, fechaFin: ff, fechaPago: fp })
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const generar = async (idNomina: number): Promise<void> => {
    setBusy(true);
    try {
      await api<Nomina>(`/nominas/${idNomina}/generar`, {
        method: "POST",
        body: JSON.stringify({
          porcentajeIsr: Number(isr),
          porcentajeImssEmpleado: Number(imss),
          bonificacionDefault: 0,
          otrasDeduccionesDefault: 0
        })
      });
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
          <h1>Nómina</h1>
          <p className="muted">Periodos (`nominas`) y líneas (`detalle_nomina`). Simulación al regenerar.</p>
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Nuevo periodo</h2>
        <form className="grid grid-2" onSubmit={(e) => void crear(e)}>
          <div className="field">
            <label htmlFor="fi">Fecha inicio</label>
            <input id="fi" type="date" value={fi} onChange={(e) => setFi(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ff">Fecha fin</label>
            <input id="ff" type="date" value={ff} onChange={(e) => setFf(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="fp">Fecha de pago</label>
            <input id="fp" type="date" value={fp} onChange={(e) => setFp(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="isr">ISR % (parametrizable)</label>
            <input id="isr" type="number" step="0.01" value={isr} onChange={(e) => setIsr(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="imss">IMSS empleado %</label>
            <input id="imss" type="number" step="0.01" value={imss} onChange={(e) => setImss(e.target.value)} />
          </div>
          <div className="field" style={{ alignSelf: "end" }}>
            <button type="submit" disabled={busy}>
              Crear periodo
            </button>
          </div>
        </form>
      </div>

      {rows.map((n) => (
        <div className="card" key={n.idNomina} style={{ marginBottom: "1rem" }}>
          <div className="row-actions" style={{ justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <div>
              <strong>Periodo #{n.idNomina}</strong>
              <div className="muted">
                {n.fechaInicio.slice(0, 10)} → {n.fechaFin.slice(0, 10)} · pago {n.fechaPago.slice(0, 10)}
              </div>
            </div>
            <button type="button" disabled={busy} onClick={() => void generar(n.idNomina)}>
              Generar / simular detalle
            </button>
          </div>
          {n.detalles.length === 0 ? (
            <p className="muted">Sin detalle aún.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Salario base</th>
                  <th>Bonificaciones</th>
                  <th>Deducciones</th>
                  <th>Neto</th>
                </tr>
              </thead>
              <tbody>
                {n.detalles.map((d) => (
                  <tr key={d.idDetalle}>
                    <td>
                      {d.empleado.nombre} {d.empleado.apellido}
                    </td>
                    <td>{String(d.salarioBase)}</td>
                    <td>{String(d.bonificaciones)}</td>
                    <td>{String(d.deducciones)}</td>
                    <td>{String(d.salarioNeto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
