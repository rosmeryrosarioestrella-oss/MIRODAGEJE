import { Navigate } from "react-router-dom";
import { getSessionUser, getToken } from "./api";

export function MiExpedienteRedirect() {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  const u = getSessionUser();
  if (!u) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={`/empleados/${u.idEmpleado}/expediente`} replace />;
}
