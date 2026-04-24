import { Navigate } from "react-router-dom";
import { EmpleadosPage } from "./pages/EmpleadosPage";
import { getSessionUser, getToken } from "./api";

export function HomeGate() {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  const u = getSessionUser();
  if (!u) {
    return <p className="muted">Cargando sesión…</p>;
  }
  if (u.rol === "EMPLEADO") {
    return <Navigate to="/mi-expediente" replace />;
  }
  return <EmpleadosPage />;
}
