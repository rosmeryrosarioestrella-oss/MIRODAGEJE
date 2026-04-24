import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware, requireRoles } from "../middleware/auth";
import { prismaErrorMessage } from "../util/prismaErrorMessage";

export const incidenciasRouter = Router();
incidenciasRouter.use(authMiddleware);

/** Valores permitidos en `tipo` (VARCHAR en BD). */
const TIPOS_INCIDENCIA = new Set([
  "VACACIONES",
  "PERMISO",
  "LICENCIA_MEDICA",
  "FALTA",
  "OTRO"
]);

function parseFecha(d: unknown): Date | null {
  if (d == null || String(d).trim() === "") return null;
  const x = new Date(String(d));
  return Number.isNaN(x.getTime()) ? null : x;
}

incidenciasRouter.get("/", requireRoles("ADMIN", "RRHH"), async (req, res) => {
  try {
    const raw = req.query.idEmpleado;
    const idEmpleado =
      raw != null && String(raw).trim() !== "" && !Number.isNaN(Number(raw)) ? Number(raw) : undefined;
    const rows = await prisma.incidencia.findMany({
      where: idEmpleado != null ? { idEmpleado } : undefined,
      orderBy: { fechaInicio: "desc" },
      include: {
        empleado: { select: { idEmpleado: true, nombre: true, apellido: true, email: true } }
      }
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

incidenciasRouter.get("/empleado/:idEmpleado", async (req, res) => {
  try {
    const idEmpleado = Number(req.params.idEmpleado);
    if (req.auth?.rol === "EMPLEADO" && idEmpleado !== req.auth.idEmpleado) {
      res.status(403).json({ error: "No autorizado" });
      return;
    }
    if (req.auth?.rol === "EMPLEADO") {
      const rows = await prisma.incidencia.findMany({
        where: { idEmpleado },
        orderBy: { fechaInicio: "desc" }
      });
      res.json(rows);
      return;
    }
    if (req.auth?.rol !== "ADMIN" && req.auth?.rol !== "RRHH") {
      res.status(403).json({ error: "Permisos insuficientes" });
      return;
    }
    const rows = await prisma.incidencia.findMany({
      where: { idEmpleado },
      orderBy: { fechaInicio: "desc" }
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

incidenciasRouter.post("/", requireRoles("ADMIN", "RRHH"), async (req, res) => {
  try {
    const { idEmpleado, tipo, fechaInicio, fechaFin, descripcion } = req.body ?? {};
    if (idEmpleado == null || tipo == null || fechaInicio == null || fechaFin == null) {
      res.status(400).json({ error: "idEmpleado, tipo, fechaInicio y fechaFin son obligatorios" });
      return;
    }
    const tipoNorm = String(tipo).trim().toUpperCase();
    if (!TIPOS_INCIDENCIA.has(tipoNorm)) {
      res.status(400).json({
        error: `Tipo inválido. Use: ${[...TIPOS_INCIDENCIA].join(", ")}`
      });
      return;
    }
    const fi = parseFecha(fechaInicio);
    const ff = parseFecha(fechaFin);
    if (!fi || !ff) {
      res.status(400).json({ error: "fechas inválidas" });
      return;
    }
    if (ff < fi) {
      res.status(400).json({ error: "La fecha fin no puede ser anterior a la fecha inicio" });
      return;
    }
    const emp = await prisma.empleado.findUnique({ where: { idEmpleado: Number(idEmpleado) } });
    if (!emp) {
      res.status(400).json({ error: "Empleado no encontrado" });
      return;
    }
    const created = await prisma.incidencia.create({
      data: {
        idEmpleado: Number(idEmpleado),
        tipo: tipoNorm,
        fechaInicio: fi,
        fechaFin: ff,
        descripcion: descripcion != null && String(descripcion).trim() !== "" ? String(descripcion).trim() : null
      },
      include: {
        empleado: { select: { idEmpleado: true, nombre: true, apellido: true, email: true } }
      }
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

incidenciasRouter.put("/:id", requireRoles("ADMIN", "RRHH"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const existing = await prisma.incidencia.findUnique({ where: { idIncidencia: id } });
    if (!existing) {
      res.status(404).json({ error: "Incidencia no encontrada" });
      return;
    }
    const b = req.body ?? {};
    const data: {
      tipo?: string;
      fechaInicio?: Date;
      fechaFin?: Date;
      descripcion?: string | null;
    } = {};
    if (b.tipo != null) {
      const tipoNorm = String(b.tipo).trim().toUpperCase();
      if (!TIPOS_INCIDENCIA.has(tipoNorm)) {
        res.status(400).json({ error: "Tipo inválido" });
        return;
      }
      data.tipo = tipoNorm;
    }
    if (b.fechaInicio != null) {
      const fi = parseFecha(b.fechaInicio);
      if (!fi) {
        res.status(400).json({ error: "fechaInicio inválida" });
        return;
      }
      data.fechaInicio = fi;
    }
    if (b.fechaFin != null) {
      const ff = parseFecha(b.fechaFin);
      if (!ff) {
        res.status(400).json({ error: "fechaFin inválida" });
        return;
      }
      data.fechaFin = ff;
    }
    if (b.descripcion !== undefined) {
      data.descripcion =
        b.descripcion != null && String(b.descripcion).trim() !== "" ? String(b.descripcion).trim() : null;
    }
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "Nada que actualizar" });
      return;
    }
    const fi = data.fechaInicio ?? existing.fechaInicio;
    const ff = data.fechaFin ?? existing.fechaFin;
    if (ff < fi) {
      res.status(400).json({ error: "La fecha fin no puede ser anterior a la fecha inicio" });
      return;
    }
    const updated = await prisma.incidencia.update({
      where: { idIncidencia: id },
      data,
      include: {
        empleado: { select: { idEmpleado: true, nombre: true, apellido: true, email: true } }
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

incidenciasRouter.delete("/:id", requireRoles("ADMIN", "RRHH"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.incidencia.delete({ where: { idIncidencia: id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});
