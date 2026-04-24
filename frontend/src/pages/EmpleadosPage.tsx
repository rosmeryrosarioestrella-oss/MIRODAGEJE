import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type EmpleadoRow = {
  idEmpleado: number;
  nombre: string;
  apellido: string;
  email: string;
  estado: string;
  departamento?: { nombre: string };
  puesto?: { nombre: string };
};

type Departamento = { idDepartamento: number; nombre: string };
type Puesto = {
  idPuesto: number;
  nombre: string;
  idDepartamento: number;
  departamento?: { nombre: string };
};

export function EmpleadosPage() {
  const [rows, setRows] = useState<EmpleadoRow[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [idDepartamento, setIdDepartamento] = useState("");
  const [idPuesto, setIdPuesto] = useState("");
  const [salarioBase, setSalarioBase] = useState("");
  const [estado, setEstado] = useState("ACTIVO");

  const loadList = useCallback(async (): Promise<void> => {
    const [emps, deps] = await Promise.all([api<EmpleadoRow[]>("/empleados"), api<Departamento[]>("/departamentos")]);
    setRows(emps);
    setDepartamentos(deps);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await loadList();
        if (alive) setError(null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [loadList]);

  useEffect(() => {
    if (!idDepartamento) {
      setPuestos([]);
      setIdPuesto("");
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const pts = await api<Puesto[]>(`/puestos?idDepartamento=${encodeURIComponent(idDepartamento)}`);
        if (!alive) return;
        setPuestos(pts);
        setIdPuesto((prev) => {
          if (!prev) return "";
          return pts.some((p) => String(p.idPuesto) === prev) ? prev : "";
        });
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [idDepartamento]);

  const resetForm = (): void => {
    setNombre("");
    setApellido("");
    setCedula("");
    setEmail("");
    setTelefono("");
    setFechaIngreso("");
    setIdDepartamento("");
    setIdPuesto("");
    setSalarioBase("");
    setEstado("ACTIVO");
    setPuestos([]);
  };

  const registrar = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setOkMsg(null);
    setError(null);
    if (!nombre.trim() || !apellido.trim() || !cedula.trim() || !email.trim() || !fechaIngreso || !idDepartamento || !idPuesto || salarioBase === "") {
      setError("Complete los campos obligatorios.");
      return;
    }
    setBusy(true);
    try {
      await api("/empleados", {
        method: "POST",
        body: JSON.stringify({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          cedula: cedula.trim(),
          email: email.trim(),
          telefono: telefono.trim() || null,
          fechaIngreso,
          idDepartamento: Number(idDepartamento),
          idPuesto: Number(idPuesto),
          salarioBase: Number(salarioBase),
          estado
        })
      });
      resetForm();
      await loadList();
      setOkMsg("Empleado registrado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setBusy(false);
    }
  };

  const sinDepartamentos = departamentos.length === 0;
  const sinPuestosEnDepto = Boolean(idDepartamento) && puestos.length === 0;

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Empleados</h1>
          <p className="muted">Alta de expedientes y consulta del listado.</p>
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}
      {okMsg ? (
        <p className="pill" style={{ marginBottom: "1rem", display: "inline-block" }}>
          {okMsg}
        </p>
      ) : null}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Registrar nuevo empleado</h2>
        {sinDepartamentos ? (
          <p className="muted">
            Debe existir al menos un departamento. Créelo en <Link to="/catalogos">Catálogos</Link>.
          </p>
        ) : (
          <form onSubmit={(e) => void registrar(e)} className="grid grid-2">
            <div className="field">
              <label htmlFor="emp-nombre">Nombre *</label>
              <input id="emp-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" />
            </div>
            <div className="field">
              <label htmlFor="emp-apellido">Apellido *</label>
              <input id="emp-apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} autoComplete="family-name" />
            </div>
            <div className="field">
              <label htmlFor="emp-cedula">Cédula / ID *</label>
              <input id="emp-cedula" value={cedula} onChange={(e) => setCedula(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="emp-email">Correo *</label>
              <input id="emp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="field">
              <label htmlFor="emp-tel">Teléfono</label>
              <input id="emp-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="emp-fi">Fecha de ingreso *</label>
              <input id="emp-fi" type="date" required value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="emp-dep">Departamento *</label>
              <select
                id="emp-dep"
                required
                value={idDepartamento}
                onChange={(e) => {
                  setIdDepartamento(e.target.value);
                  setIdPuesto("");
                }}
              >
                <option value="">Seleccione…</option>
                {departamentos.map((d) => (
                  <option key={d.idDepartamento} value={d.idDepartamento}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="emp-puesto">Puesto *</label>
              <select id="emp-puesto" required value={idPuesto} onChange={(e) => setIdPuesto(e.target.value)} disabled={!idDepartamento}>
                <option value="">{idDepartamento ? "Seleccione un puesto…" : "Primero elija departamento"}</option>
                {puestos.map((p) => (
                  <option key={p.idPuesto} value={p.idPuesto}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              {sinPuestosEnDepto ? (
                <p className="muted" style={{ marginTop: "0.35rem", fontSize: "0.85rem" }}>
                  No hay puestos en este departamento. Defínalos en <Link to="/catalogos">Catálogos</Link>.
                </p>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="emp-sal">Salario base *</label>
              <input
                id="emp-sal"
                type="number"
                min={0}
                step="0.01"
                required
                value={salarioBase}
                onChange={(e) => setSalarioBase(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="emp-est">Estado</label>
              <select id="emp-est" value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
            <div className="field" style={{ alignSelf: "end" }}>
              <button type="submit" disabled={busy}>
                {busy ? "Guardando…" : "Registrar empleado"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Listado</h2>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Departamento</th>
                <th>Puesto</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.idEmpleado}>
                  <td>
                    {r.nombre} {r.apellido}
                  </td>
                  <td>{r.email}</td>
                  <td>{r.departamento?.nombre ?? "—"}</td>
                  <td>{r.puesto?.nombre ?? "—"}</td>
                  <td>
                    <span className="pill">{r.estado}</span>
                  </td>
                  <td>
                    <Link
                      className="btn secondary"
                      to={`/empleados/${r.idEmpleado}/expediente`}
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
                    >
                      Expediente
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
