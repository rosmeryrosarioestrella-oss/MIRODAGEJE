import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware, requireRoles } from "../middleware/auth";
import { prismaErrorMessage } from "../util/prismaErrorMessage";

export const asistenciasRouter = Router();
asistenciasRouter.use(authMiddleware);

function parseFechaOnly(fecha: unknown): Date | null {
  if (fecha == null || String(fecha).trim() === "") return null;
  const d = new Date(String(fecha));
  return Number.isNaN(d.getTime()) ? null : d;
}

const estadosEmpleado = new Set(["NORMAL", "RETARDO"]);

asistenciasRouter.get("/empleado/:idEmpleado", async (req, res) => {
  try {
    const idEmpleado = Number(req.params.idEmpleado);
    if (req.auth?.rol === "EMPLEADO" && idEmpleado !== req.auth.idEmpleado) {
      res.status(403).json({ error: "No autorizado" });
      return;
    }
    if (req.auth?.rol === "EMPLEADO" && idEmpleado === req.auth.idEmpleado) {
      const rows = await prisma.asistencia.findMany({
        where: { idEmpleado },
        orderBy: { fecha: "desc" }
      });
      res.json(rows);
      return;
    }
    if (req.auth?.rol !== "ADMIN" && req.auth?.rol !== "RRHH") {
      res.status(403).json({ error: "Permisos insuficientes" });
      return;
    }
    const rows = await prisma.asistencia.findMany({
      where: { idEmpleado },
      orderBy: { fecha: "desc" }
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

asistenciasRouter.post("/", async (req, res) => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
    const body = req.body ?? {};
    const fecha = parseFechaOnly(body.fecha);
    if (!fecha) {
      res.status(400).json({ error: "fecha requerida (YYYY-MM-DD)" });
      return;
    }

    let idEmpleado: number;
    if (req.auth.rol === "EMPLEADO") {
      idEmpleado = req.auth.idEmpleado;
    } else if (req.auth.rol === "ADMIN" || req.auth.rol === "RRHH") {
      if (body.idEmpleado == null || Number.isNaN(Number(body.idEmpleado))) {
        res.status(400).json({ error: "idEmpleado requerido" });
        return;
      }
      idEmpleado = Number(body.idEmpleado);
    } else {
      res.status(403).json({ error: "Permisos insuficientes" });
      return;
    }

    let estado = String(body.estado ?? "NORMAL").trim().toUpperCase();
    if (req.auth.rol === "EMPLEADO") {
      if (!estadosEmpleado.has(estado)) {
        res.status(400).json({ error: "Solo puede registrar estado NORMAL o RETARDO" });
        return;
      }
    } else if (!estado) {
      res.status(400).json({ error: "estado requerido" });
      return;
    }

    const dup = await prisma.asistencia.findFirst({
      where: { idEmpleado, fecha }
    });
    if (dup) {
      res.status(409).json({
        error: "Ya existe un registro de asistencia para esa fecha. Puede actualizarlo (marcar salida) desde la lista.",
        idAsistencia: dup.idAsistencia
      });
      return;
    }

    const created = await prisma.asistencia.create({
      data: {
        idEmpleado,
        fecha,
        horaEntrada: body.horaEntrada != null ? String(body.horaEntrada) : null,
        horaSalida: body.horaSalida != null ? String(body.horaSalida) : null,
        estado
      }
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

asistenciasRouter.put("/:id", async (req, res) => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const row = await prisma.asistencia.findUnique({ where: { idAsistencia: id } });
    if (!row) {
      res.status(404).json({ error: "Asistencia no encontrada" });
      return;
    }

    const b = req.body ?? {};

    if (req.auth.rol === "EMPLEADO") {
      if (row.idEmpleado !== req.auth.idEmpleado) {
        res.status(403).json({ error: "No autorizado" });
        return;
      }
      const data: { horaEntrada?: string | null; horaSalida?: string | null } = {};
      if (b.horaEntrada !== undefined) {
        data.horaEntrada = b.horaEntrada != null && String(b.horaEntrada).trim() !== "" ? String(b.horaEntrada).trim() : null;
      }
      if (b.horaSalida !== undefined) {
        data.horaSalida = b.horaSalida != null && String(b.horaSalida).trim() !== "" ? String(b.horaSalida).trim() : null;
      }
      if (Object.keys(data).length === 0) {
        res.status(400).json({ error: "Indique horaEntrada u horaSalida para actualizar" });
        return;
      }
      const updated = await prisma.asistencia.update({
        where: { idAsistencia: id },
        data
      });
      res.json(updated);
      return;
    }

    if (req.auth.rol !== "ADMIN" && req.auth.rol !== "RRHH") {
      res.status(403).json({ error: "Permisos insuficientes" });
      return;
    }

    const adminData: {
      fecha?: Date;
      horaEntrada?: string | null;
      horaSalida?: string | null;
      estado?: string;
    } = {};
    if (b.fecha != null) {
      const f = parseFechaOnly(b.fecha);
      if (f) adminData.fecha = f;
    }
    if (b.horaEntrada !== undefined) {
      adminData.horaEntrada = b.horaEntrada ? String(b.horaEntrada) : null;
    }
    if (b.horaSalida !== undefined) {
      adminData.horaSalida = b.horaSalida ? String(b.horaSalida) : null;
    }
    if (b.estado != null) {
      adminData.estado = String(b.estado);
    }
    if (Object.keys(adminData).length === 0) {
      res.status(400).json({ error: "Nada que actualizar" });
      return;
    }
    const updated = await prisma.asistencia.update({
      where: { idAsistencia: id },
      data: adminData
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

asistenciasRouter.delete("/:id", requireRoles("ADMIN", "RRHH"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.asistencia.delete({ where: { idAsistencia: id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});
