export type UsuarioRol = "ADMIN" | "RRHH" | "EMPLEADO";

export function isUsuarioRol(v: string): v is UsuarioRol {
  return v === "ADMIN" || v === "RRHH" || v === "EMPLEADO";
}
