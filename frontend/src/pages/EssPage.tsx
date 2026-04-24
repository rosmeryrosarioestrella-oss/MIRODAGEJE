import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getSessionUser } from "../api";

type EmpleadoRow = {
  idEmpleado: number;
  nombre: string;
  apellido: string;
  email: string;
};

type Nomina = {
  idNomina: number;
  fechaPago: string;
  detalles: Array<{
    idDetalle: number;
    salarioNeto: string | number;
    salarioBase: string | number;
    deducciones: string | number;
    empleado?: { nombre: string; apellido: string; idEmpleado: number };
  }>;
};

export function EssPage() {
  const [me, setMe] = useState<EmpleadoRow | null>(null);
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getSessionUser();
    if (!session) return;
    let alive = true;
    void (async () => {
      try {
        const list = await api<EmpleadoRow[]>("/empleados");
        if (!alive) return;
        const mine = list.find((e) => e.idEmpleado === session.idEmpleado);
        setMe(mine ?? { idEmpleado: session.idEmpleado, nombre: session.usuario, apellido: "", email: "" });
        const all = await api<Nomina[]>("/nominas");
        if (!alive) return;
        setNominas(all);
        setError(null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return <p className="error">{error}</p>;
  }
  if (!me) {
    return <p className="muted">Cargando portal…</p>;
  }

  const misRecibos = nominas.flatMap((n) =>
    n.detalles.map((d) => ({
      idNomina: n.idNomina,
      fechaPago: n.fechaPago,
      empleado: d.empleado,
      ...d
    }))
  );

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Recibos y nómina</h1>
          <p className="muted">
            Vista de periodos y líneas de detalle. Hola, {me.nombre || getSessionUser()?.usuario}.
          </p>
        </div>
        <Link className="btn secondary" to={`/empleados/${me.idEmpleado}/expediente`}>
          Ver mi expediente
        </Link>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Detalle por periodo</h2>
        {misRecibos.length === 0 ? (
          <p className="muted">Aún no hay líneas de nómina generadas.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Periodo (pago)</th>
                <th>Base</th>
                <th>Deducciones</th>
                <th>Neto</th>
              </tr>
            </thead>
            <tbody>
              {misRecibos.slice(0, 40).map((r) => (
                <tr key={`${r.idNomina}-${r.idDetalle}`}>
                  <td>
                    {r.empleado ? `${r.empleado.nombre} ${r.empleado.apellido}` : "—"}
                  </td>
                  <td>
                    #{r.idNomina} · {r.fechaPago.slice(0, 10)}
                  </td>
                  <td>{String(r.salarioBase)}</td>
                  <td>{String(r.deducciones)}</td>
                  <td>{String(r.salarioNeto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
