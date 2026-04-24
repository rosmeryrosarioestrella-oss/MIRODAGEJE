import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";

type Departamento = { idDepartamento: number; nombre: string };
type Puesto = {
  idPuesto: number;
  nombre: string;
  descripcion: string | null;
  idDepartamento: number;
  departamento?: { nombre: string };
};

type DepDraft = { idDepartamento: number; nombre: string };
type PuestoDraft = {
  idPuesto: number;
  nombre: string;
  descripcion: string;
  idDepartamento: number;
};

export function CatalogosPage() {
  const [deps, setDeps] = useState<Departamento[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [dn, setDn] = useState("");
  const [pn, setPn] = useState("");
  const [pd, setPd] = useState("");
  const [idDepPuesto, setIdDepPuesto] = useState("");
  const [depDraft, setDepDraft] = useState<DepDraft | null>(null);
  const [puestoDraft, setPuestoDraft] = useState<PuestoDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (): Promise<void> => {
    try {
      const [d, p] = await Promise.all([api<Departamento[]>("/departamentos"), api<Puesto[]>("/puestos")]);
      setDeps(Array.isArray(d) ? d : []);
      setPuestos(Array.isArray(p) ? p : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const addDep = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!dn.trim()) return;
    setBusy(true);
    try {
      await api("/departamentos", { method: "POST", body: JSON.stringify({ nombre: dn.trim() }) });
      setDn("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const saveDep = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!depDraft?.nombre.trim()) return;
    setBusy(true);
    try {
      await api(`/departamentos/${depDraft.idDepartamento}`, {
        method: "PUT",
        body: JSON.stringify({ nombre: depDraft.nombre.trim() })
      });
      setDepDraft(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const addPuesto = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!pn.trim() || !idDepPuesto) return;
    setBusy(true);
    try {
      await api("/puestos", {
        method: "POST",
        body: JSON.stringify({
          nombre: pn.trim(),
          descripcion: pd || undefined,
          idDepartamento: Number(idDepPuesto)
        })
      });
      setPn("");
      setPd("");
      setIdDepPuesto("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const savePuesto = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!puestoDraft?.nombre.trim()) return;
    setBusy(true);
    try {
      await api(`/puestos/${puestoDraft.idPuesto}`, {
        method: "PUT",
        body: JSON.stringify({
          nombre: puestoDraft.nombre.trim(),
          descripcion: puestoDraft.descripcion.trim() ? puestoDraft.descripcion.trim() : null,
          idDepartamento: puestoDraft.idDepartamento
        })
      });
      setPuestoDraft(null);
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
          <h1>Catálogos</h1>
          <p className="muted">Cada puesto queda asociado a un departamento. Puede editar nombre y departamento.</p>
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}

      <div className="grid grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Departamentos</h2>
          <form onSubmit={(e) => void addDep(e)} className="row-actions" style={{ marginBottom: "1rem" }}>
            <input placeholder="Nombre" value={dn} onChange={(e) => setDn(e.target.value)} />
            <button type="submit" disabled={busy}>
              Añadir
            </button>
          </form>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {deps.map((d) =>
              depDraft?.idDepartamento === d.idDepartamento ? (
                <form key={d.idDepartamento} onSubmit={(e) => void saveDep(e)} className="row-actions" style={{ flexWrap: "nowrap" }}>
                  <input
                    style={{ flex: 1, minWidth: 0 }}
                    value={depDraft.nombre}
                    onChange={(e) => setDepDraft({ ...depDraft, nombre: e.target.value })}
                    autoFocus
                  />
                  <button type="submit" disabled={busy}>
                    Guardar
                  </button>
                  <button type="button" className="secondary" disabled={busy} onClick={() => setDepDraft(null)}>
                    Cancelar
                  </button>
                </form>
              ) : (
                <div key={d.idDepartamento} className="row-actions" style={{ justifyContent: "space-between" }}>
                  <span>{d.nombre}</span>
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={() => setDepDraft({ idDepartamento: d.idDepartamento, nombre: d.nombre })}
                  >
                    Editar
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Puestos por departamento</h2>
          {deps.length === 0 ? (
            <p className="muted">Cree primero al menos un departamento.</p>
          ) : (
            <form onSubmit={(e) => void addPuesto(e)} style={{ marginBottom: "1rem" }}>
              <div className="field">
                <label>Departamento *</label>
                <select required value={idDepPuesto} onChange={(e) => setIdDepPuesto(e.target.value)}>
                  <option value="">Seleccione…</option>
                  {deps.map((d) => (
                    <option key={d.idDepartamento} value={d.idDepartamento}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Nombre del puesto *</label>
                <input value={pn} onChange={(e) => setPn(e.target.value)} />
              </div>
              <div className="field">
                <label>Descripción (opcional)</label>
                <input value={pd} onChange={(e) => setPd(e.target.value)} />
              </div>
              <button type="submit" disabled={busy}>
                Añadir puesto
              </button>
            </form>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {puestos.map((p) =>
              puestoDraft?.idPuesto === p.idPuesto ? (
                <form key={p.idPuesto} onSubmit={(e) => void savePuesto(e)} className="muted" style={{ padding: "0.75rem", border: "1px solid var(--border)", borderRadius: 10 }}>
                  <div className="field">
                    <label>Departamento *</label>
                    <select
                      required
                      value={String(puestoDraft.idDepartamento)}
                      onChange={(e) =>
                        setPuestoDraft({ ...puestoDraft, idDepartamento: Number(e.target.value) })
                      }
                    >
                      {deps.map((d) => (
                        <option key={d.idDepartamento} value={d.idDepartamento}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Nombre *</label>
                    <input
                      value={puestoDraft.nombre}
                      onChange={(e) => setPuestoDraft({ ...puestoDraft, nombre: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="field">
                    <label>Descripción</label>
                    <input
                      value={puestoDraft.descripcion}
                      onChange={(e) => setPuestoDraft({ ...puestoDraft, descripcion: e.target.value })}
                    />
                  </div>
                  <div className="row-actions">
                    <button type="submit" disabled={busy}>
                      Guardar
                    </button>
                    <button type="button" className="secondary" disabled={busy} onClick={() => setPuestoDraft(null)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div key={p.idPuesto} className="row-actions" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="muted" style={{ flex: 1, minWidth: 0 }}>
                    <strong>{p.nombre}</strong>
                    <span> — {p.departamento?.nombre ?? `Depto #${p.idDepartamento}`}</span>
                    {p.descripcion ? <span>: {p.descripcion}</span> : null}
                  </div>
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      setPuestoDraft({
                        idPuesto: p.idPuesto,
                        nombre: p.nombre,
                        descripcion: p.descripcion ?? "",
                        idDepartamento: p.idDepartamento
                      })
                    }
                  >
                    Editar
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
