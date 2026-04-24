import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getSessionUser, getToken, type SessionUser } from "./api";

export function RequireRoles({ allow, children }: { allow: SessionUser["rol"][]; children: ReactNode }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  const u = getSessionUser();
  if (!u || !allow.includes(u.rol)) {
    const to = u?.rol === "EMPLEADO" ? "/mi-expediente" : "/empleados";
    return <Navigate to={to} replace />;
  }
  return <>{children}</>;
}
