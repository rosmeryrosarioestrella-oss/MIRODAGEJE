import { useEffect, useState, type ReactNode } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { api, clearAuth, getSessionUser, getToken, setSessionUser, type SessionUser } from "./api";
import { HomeGate } from "./HomeGate";
import { LoginPage } from "./pages/LoginPage";
import { EmpleadosPage } from "./pages/EmpleadosPage";
import { ExpedientePage } from "./pages/ExpedientePage";
import { NominasPage } from "./pages/NominasPage";
import { EssPage } from "./pages/EssPage";
import { CatalogosPage } from "./pages/CatalogosPage";
import { UsuariosPage } from "./pages/UsuariosPage";
import { CapacitacionesPage } from "./pages/CapacitacionesPage";
import { BonificacionesPage } from "./pages/BonificacionesPage";
import { IncidenciasPage } from "./pages/IncidenciasPage";
import { MiExpedienteRedirect } from "./MiExpedienteRedirect";
import { MiAsistenciaPage } from "./pages/MiAsistenciaPage";
import { RequireRoles } from "./RequireRoles";
import { AppFooter } from "./components/AppFooter";

function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(() => !getToken() || !!getSessionUser());

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    if (getSessionUser()) {
      setReady(true);
      return;
    }
    void api<SessionUser>("/auth/me")
      .then((m) => {
        setSessionUser(m);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => setReady(true));
  }, []);

  const logout = (): void => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  if (!ready) {
    return (
      <div className="app-shell app-shell--single">
        <div className="app-main-column">
          <main className="app-main-grow">
            <p className="muted">Cargando sesión…</p>
          </main>
          <AppFooter />
        </div>
      </div>
    );
  }
  const u = getSessionUser();
  if (!u) {
    return <Navigate to="/login" replace />;
  }
  const rol = u.rol;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <NavLink
            className={({ isActive }) => `brand-link${isActive ? " brand-link-active" : ""}`}
            to={rol === "EMPLEADO" ? "/mi-expediente" : "/empleados"}
            end={rol === "EMPLEADO"}
          >
            <img src="/branding/logo-icon.png" alt="" className="brand-icon-img" width={46} height={46} />
            <div className="brand-text">
              <span className="brand-title">MIRODAGEJE</span>
              <span className="brand-sub">Gestión de recursos humanos</span>
            </div>
          </NavLink>
        </div>
        {rol === "EMPLEADO" ? (
          <>
            <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/mi-expediente">
              Mi expediente
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/mi-asistencia">
              Mi asistencia
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/capacitaciones">
              Capacitaciones
            </NavLink>
          </>
        ) : (
          <>
            <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/empleados">
              Empleados
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/incidencias">
              Incidencias
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/capacitaciones">
              Capacitaciones
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/catalogos">
              Catálogos
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/bonificaciones">
              Bonificaciones
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/nominas">
              Nómina
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/ess">
              Recibos / portal
            </NavLink>
            {rol === "ADMIN" ? (
              <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/usuarios">
                Usuarios
              </NavLink>
            ) : null}
          </>
        )}
        <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
          <button type="button" className="secondary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="app-main-column">
        <div className="mobile-nav">
          <NavLink
            to={rol === "EMPLEADO" ? "/mi-expediente" : "/empleados"}
            title="Inicio"
            style={{ display: "flex", alignItems: "center" }}
          >
            <img className="mobile-brand-img" src="/branding/logo-icon.png" alt="MIRODAGEJE" width={72} height={36} />
          </NavLink>
          {rol === "EMPLEADO" ? (
            <>
              <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/mi-expediente">
                Expediente
              </NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/mi-asistencia">
                Asistencia
              </NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/capacitaciones">
                Capacitaciones
              </NavLink>
            </>
          ) : (
            <>
              <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/empleados">
                Empleados
              </NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/incidencias">
                Incidencias
              </NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/capacitaciones">
                Capacitaciones
              </NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/catalogos">
                Catálogos
              </NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/bonificaciones">
                Bonificaciones
              </NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/nominas">
                Nómina
              </NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/ess">
                Recibos
              </NavLink>
              {rol === "ADMIN" ? (
                <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/usuarios">
                  Usuarios
                </NavLink>
              ) : null}
            </>
          )}
          <button type="button" className="secondary" onClick={logout}>
            Salir
          </button>
        </div>
        <main className="app-main-grow">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Shell>
            <HomeGate />
          </Shell>
        }
      />
      <Route
        path="/mi-expediente"
        element={
          <Shell>
            <MiExpedienteRedirect />
          </Shell>
        }
      />
      <Route
        path="/mi-asistencia"
        element={
          <Shell>
            <RequireRoles allow={["EMPLEADO"]}>
              <MiAsistenciaPage />
            </RequireRoles>
          </Shell>
        }
      />
      <Route
        path="/empleados"
        element={
          <Shell>
            <RequireRoles allow={["ADMIN", "RRHH"]}>
              <EmpleadosPage />
            </RequireRoles>
          </Shell>
        }
      />
      <Route
        path="/incidencias"
        element={
          <Shell>
            <RequireRoles allow={["ADMIN", "RRHH"]}>
              <IncidenciasPage />
            </RequireRoles>
          </Shell>
        }
      />
      <Route
        path="/empleados/:id/expediente"
        element={
          <Shell>
            <ExpedientePage />
          </Shell>
        }
      />
      <Route
        path="/capacitaciones"
        element={
          <Shell>
            <CapacitacionesPage />
          </Shell>
        }
      />
      <Route
        path="/catalogos"
        element={
          <Shell>
            <RequireRoles allow={["ADMIN", "RRHH"]}>
              <CatalogosPage />
            </RequireRoles>
          </Shell>
        }
      />
      <Route
        path="/bonificaciones"
        element={
          <Shell>
            <RequireRoles allow={["ADMIN", "RRHH"]}>
              <BonificacionesPage />
            </RequireRoles>
          </Shell>
        }
      />
      <Route
        path="/nominas"
        element={
          <Shell>
            <RequireRoles allow={["ADMIN", "RRHH"]}>
              <NominasPage />
            </RequireRoles>
          </Shell>
        }
      />
      <Route
        path="/ess"
        element={
          <Shell>
            <RequireRoles allow={["ADMIN", "RRHH"]}>
              <EssPage />
            </RequireRoles>
          </Shell>
        }
      />
      <Route
        path="/usuarios"
        element={
          <Shell>
            <RequireRoles allow={["ADMIN"]}>
              <UsuariosPage />
            </RequireRoles>
          </Shell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
