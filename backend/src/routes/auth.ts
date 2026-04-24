import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { authMiddleware, signToken } from "../middleware/auth";
import { isUsuarioRol } from "../types/roles";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const usuario = String(req.body?.usuario ?? "");
  const password = String(req.body?.password ?? "");
  if (!usuario || !password) {
    res.status(400).json({ error: "Usuario y contraseña requeridos" });
    return;
  }

  const row = await prisma.usuario.findUnique({ where: { usuario } });
  if (!row) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const ok = await bcrypt.compare(password, row.contrasena);
  if (!ok) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const rol = isUsuarioRol(row.rol) ? row.rol : "EMPLEADO";
  const token = signToken({
    sub: row.idUsuario,
    rol,
    idEmpleado: row.idEmpleado
  });

  res.json({
    token,
    usuario: {
      idUsuario: row.idUsuario,
      usuario: row.usuario,
      rol,
      idEmpleado: row.idEmpleado
    }
  });
});

authRouter.get("/me", authMiddleware, async (req, res) => {
  if (!req.auth) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  const row = await prisma.usuario.findUnique({
    where: { idUsuario: req.auth.sub },
    select: { idUsuario: true, usuario: true, rol: true, idEmpleado: true }
  });
  if (!row) {
    res.status(401).json({ error: "Usuario no encontrado" });
    return;
  }
  const rol = isUsuarioRol(row.rol) ? row.rol : "EMPLEADO";
  res.json({
    idUsuario: row.idUsuario,
    usuario: row.usuario,
    rol,
    idEmpleado: row.idEmpleado
  });
});
