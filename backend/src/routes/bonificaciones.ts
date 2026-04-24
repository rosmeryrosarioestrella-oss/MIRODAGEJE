import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { authMiddleware, requireRoles } from "../middleware/auth";
import { prismaErrorMessage } from "../util/prismaErrorMessage";

export const bonificacionesRouter = Router();
bonificacionesRouter.use(authMiddleware);
bonificacionesRouter.use(requireRoles("ADMIN", "RRHH"));

const includeAsignacion = {
  tipoBonificacion: { select: { idTipoBonificacion: true, nombre: true, activo: true } },
  empleado: { select: { idEmpleado: true, nombre: true, apellido: true, email: true } }
} as const;

bonificacionesRouter.get("/tipos", async (_req, res) => {
  try {
    const rows = await prisma.tipoBonificacion.findMany({ orderBy: { nombre: "asc" } });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

bonificacionesRouter.post("/tipos", async (req, res) => {
  try {
    const nombre = String(req.body?.nombre ?? "").trim();
    if (!nombre) {
      res.status(400).json({ error: "nombre requerido" });
      return;
    }
    const descripcion =
      req.body?.descripcion != null && String(req.body.descripcion).trim() !== ""
        ? String(req.body.descripcion).trim()
        : null;
    const activoRaw = String(req.body?.activo ?? "ACTIVO").trim().toUpperCase();
    const activo = activoRaw === "INACTIVO" ? "INACTIVO" : "ACTIVO";
    const created = await prisma.tipoBonificacion.create({
      data: { nombre, descripcion, activo }
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

bonificacionesRouter.put("/tipos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const nombre = String(req.body?.nombre ?? "").trim();
    if (!nombre) {
      res.status(400).json({ error: "nombre requerido" });
      return;
    }
    const body = req.body ?? {};
    const data: { nombre: string; descripcion?: string | null; activo?: string } = { nombre };
    if ("descripcion" in body) {
      data.descripcion =
        body.descripcion != null && String(body.descripcion).trim() !== ""
          ? String(body.descripcion).trim()
          : null;
    }
    if ("activo" in body) {
      const ar = String(body.activo).trim().toUpperCase();
      data.activo = ar === "INACTIVO" ? "INACTIVO" : "ACTIVO";
    }
    const updated = await prisma.tipoBonificacion.update({
      where: { idTipoBonificacion: id },
      data
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

bonificacionesRouter.delete("/tipos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const n = await prisma.asignacionBonificacion.count({ where: { idTipoBonificacion: id } });
    if (n > 0) {
      res.status(400).json({
        error: `No puede eliminar el tipo: hay ${n} asignación(es) a empleados. Desactive el tipo (INACTIVO) o elimine las asignaciones.`
      });
      return;
    }
    await prisma.tipoBonificacion.delete({ where: { idTipoBonificacion: id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

bonificacionesRouter.get("/asignaciones", async (req, res) => {
  try {
    const raw = req.query.idEmpleado;
    const idEmpleado =
      raw != null && String(raw).trim() !== "" && !Number.isNaN(Number(raw)) ? Number(raw) : undefined;
    const rows = await prisma.asignacionBonificacion.findMany({
      where: idEmpleado != null ? { idEmpleado } : undefined,
      orderBy: [{ fecha: "desc" }, { idAsignacion: "desc" }],
      include: includeAsignacion
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

bonificacionesRouter.post("/asignaciones", async (req, res) => {
  try {
    const idEmpleado = req.body?.idEmpleado != null ? Number(req.body.idEmpleado) : NaN;
    const idTipoBonificacion = req.body?.idTipoBonificacion != null ? Number(req.body.idTipoBonificacion) : NaN;
    const monto = req.body?.monto != null ? Number(req.body.monto) : NaN;
    const fechaStr = req.body?.fecha != null ? String(req.body.fecha) : "";
    if (Number.isNaN(idEmpleado) || Number.isNaN(idTipoBonificacion) || Number.isNaN(monto) || monto <= 0) {
      res.status(400).json({ error: "idEmpleado, idTipoBonificacion y monto (> 0) son obligatorios" });
      return;
    }
    if (!fechaStr.trim()) {
      res.status(400).json({ error: "fecha requerida" });
      return;
    }
    const fecha = new Date(fechaStr);
    if (Number.isNaN(fecha.getTime())) {
      res.status(400).json({ error: "fecha inválida" });
      return;
    }
    const tipo = await prisma.tipoBonificacion.findUnique({ where: { idTipoBonificacion } });
    if (!tipo || tipo.activo !== "ACTIVO") {
      res.status(400).json({ error: "Tipo de bonificación no encontrado o inactivo" });
      return;
    }
    const emp = await prisma.empleado.findUnique({ where: { idEmpleado } });
    if (!emp) {
      res.status(400).json({ error: "Empleado no encontrado" });
      return;
    }
    const notas =
      req.body?.notas != null && String(req.body.notas).trim() !== ""
        ? String(req.body.notas).trim().slice(0, 500)
        : null;
    const created = await prisma.asignacionBonificacion.create({
      data: {
        idEmpleado,
        idTipoBonificacion,
        monto: new Prisma.Decimal(monto),
        fecha,
        notas
      },
      include: includeAsignacion
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

bonificacionesRouter.put("/asignaciones/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const data: {
      monto?: Prisma.Decimal;
      fecha?: Date;
      notas?: string | null;
      idTipoBonificacion?: number;
      idEmpleado?: number;
    } = {};
    if (req.body?.monto != null) {
      const m = Number(req.body.monto);
      if (Number.isNaN(m) || m <= 0) {
        res.status(400).json({ error: "monto inválido" });
        return;
      }
      data.monto = new Prisma.Decimal(m);
    }
    if (req.body?.fecha != null) {
      const f = new Date(String(req.body.fecha));
      if (Number.isNaN(f.getTime())) {
        res.status(400).json({ error: "fecha inválida" });
        return;
      }
      data.fecha = f;
    }
    if (req.body?.notas !== undefined) {
      data.notas =
        req.body.notas != null && String(req.body.notas).trim() !== ""
          ? String(req.body.notas).trim().slice(0, 500)
          : null;
    }
    if (req.body?.idTipoBonificacion != null) {
      const tid = Number(req.body.idTipoBonificacion);
      if (Number.isNaN(tid)) {
        res.status(400).json({ error: "idTipoBonificacion inválido" });
        return;
      }
      const tipo = await prisma.tipoBonificacion.findUnique({ where: { idTipoBonificacion: tid } });
      if (!tipo || tipo.activo !== "ACTIVO") {
        res.status(400).json({ error: "Tipo de bonificación no encontrado o inactivo" });
        return;
      }
      data.idTipoBonificacion = tid;
    }
    if (req.body?.idEmpleado != null) {
      const eid = Number(req.body.idEmpleado);
      if (Number.isNaN(eid)) {
        res.status(400).json({ error: "idEmpleado inválido" });
        return;
      }
      const emp = await prisma.empleado.findUnique({ where: { idEmpleado: eid } });
      if (!emp) {
        res.status(400).json({ error: "Empleado no encontrado" });
        return;
      }
      data.idEmpleado = eid;
    }
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "Nada que actualizar" });
      return;
    }
    const updated = await prisma.asignacionBonificacion.update({
      where: { idAsignacion: id },
      data,
      include: includeAsignacion
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

bonificacionesRouter.delete("/asignaciones/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    await prisma.asignacionBonificacion.delete({ where: { idAsignacion: id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});
