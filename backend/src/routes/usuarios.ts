import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { authMiddleware, requireRoles } from "../middleware/auth";
import { isUsuarioRol } from "../types/roles";

export const usuariosRouter = Router();
usuariosRouter.use(authMiddleware);
usuariosRouter.use(requireRoles("ADMIN"));

usuariosRouter.get("/", async (_req, res) => {
  const rows = await prisma.usuario.findMany({
    orderBy: { idUsuario: "asc" },
    select: {
      idUsuario: true,
      usuario: true,
      rol: true,
      idEmpleado: true,
      empleado: { select: { idEmpleado: true, nombre: true, apellido: true, email: true } }
    }
  });
  res.json(rows);
});

usuariosRouter.post("/", async (req, res) => {
  const { idEmpleado, usuario, password, rol } = req.body ?? {};
  if (!idEmpleado || !usuario || !password || !rol) {
    res.status(400).json({ error: "idEmpleado, usuario, password y rol son obligatorios" });
    return;
  }
  if (!isUsuarioRol(String(rol))) {
    res.status(400).json({ error: "Rol inválido" });
    return;
  }
  const exists = await prisma.empleado.findUnique({ where: { idEmpleado: Number(idEmpleado) } });
  if (!exists) {
    res.status(400).json({ error: "Empleado no encontrado" });
    return;
  }
  const hash = await bcrypt.hash(String(password), 10);
  try {
    const created = await prisma.usuario.create({
      data: {
        idEmpleado: Number(idEmpleado),
        usuario: String(usuario).trim(),
        contrasena: hash,
        rol: String(rol)
      },
      include: {
        empleado: { select: { idEmpleado: true, nombre: true, apellido: true, email: true } }
      }
    });
    const out = await prisma.usuario.findUnique({
      where: { idUsuario: created.idUsuario },
      select: {
        idUsuario: true,
        usuario: true,
        rol: true,
        idEmpleado: true,
        empleado: { select: { idEmpleado: true, nombre: true, apellido: true, email: true } }
      }
    });
    res.status(201).json(out);
  } catch {
    res.status(400).json({ error: "No se pudo crear (¿usuario duplicado?)" });
  }
});

usuariosRouter.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body ?? {};
  const data: { usuario?: string; contrasena?: string; rol?: string } = {};
  if (b.usuario != null) data.usuario = String(b.usuario).trim();
  if (b.password != null && String(b.password).length > 0) {
    data.contrasena = await bcrypt.hash(String(b.password), 10);
  }
  if (b.rol != null) {
    if (!isUsuarioRol(String(b.rol))) {
      res.status(400).json({ error: "Rol inválido" });
      return;
    }
    data.rol = String(b.rol);
  }
  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "Nada que actualizar" });
    return;
  }
  const updated = await prisma.usuario.update({
    where: { idUsuario: id },
    data,
    include: {
      empleado: { select: { idEmpleado: true, nombre: true, apellido: true, email: true } }
    }
  });
  const out = await prisma.usuario.findUnique({
    where: { idUsuario: id },
    select: {
      idUsuario: true,
      usuario: true,
      rol: true,
      idEmpleado: true,
      empleado: { select: { idEmpleado: true, nombre: true, apellido: true, email: true } }
    }
  });
  res.json(out);
});

usuariosRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!req.auth) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  if (id === req.auth.sub) {
    res.status(400).json({ error: "No puede eliminar su propio usuario" });
    return;
  }
  await prisma.usuario.delete({ where: { idUsuario: id } });
  res.status(204).end();
});
