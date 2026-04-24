import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware, requireRoles } from "../middleware/auth";

export const capacitacionRouter = Router();
capacitacionRouter.use(authMiddleware);

capacitacionRouter.get("/cursos", async (_req, res) => {
  const rows = await prisma.cursoCapacitacion.findMany({ orderBy: { nombre: "asc" } });
  res.json(rows);
});

capacitacionRouter.get("/historial", requireRoles("ADMIN", "RRHH"), async (req, res) => {
  const raw = req.query.idEmpleado;
  const idEmpleado = raw != null && raw !== "" ? Number(raw) : undefined;
  const rows = await prisma.historialCapacitacion.findMany({
    where:
      idEmpleado != null && !Number.isNaN(idEmpleado)
        ? { idEmpleado }
        : undefined,
    orderBy: { fechaInicio: "desc" },
    take: 500,
    include: {
      curso: true,
      empleado: { select: { idEmpleado: true, nombre: true, apellido: true, email: true } }
    }
  });
  res.json(rows);
});

capacitacionRouter.post("/cursos", requireRoles("ADMIN", "RRHH"), async (req, res) => {
  const nombre = String(req.body?.nombre ?? "").trim();
  if (!nombre) {
    res.status(400).json({ error: "nombre requerido" });
    return;
  }
  const descripcion = req.body?.descripcion != null ? String(req.body.descripcion) : undefined;
  const duracionHoras = req.body?.duracionHoras != null ? Number(req.body.duracionHoras) : 0;
  const created = await prisma.cursoCapacitacion.create({
    data: { nombre, descripcion, duracionHoras }
  });
  res.status(201).json(created);
});

capacitacionRouter.get("/historial/:idEmpleado", async (req, res) => {
  const idEmpleado = Number(req.params.idEmpleado);
  if (req.auth?.rol === "EMPLEADO" && idEmpleado !== req.auth.idEmpleado) {
    res.status(403).json({ error: "No autorizado" });
    return;
  }
  if (req.auth?.rol !== "ADMIN" && req.auth?.rol !== "RRHH" && req.auth?.rol !== "EMPLEADO") {
    res.status(403).json({ error: "Permisos insuficientes" });
    return;
  }
  const rows = await prisma.historialCapacitacion.findMany({
    where: { idEmpleado },
    include: { curso: true },
    orderBy: { fechaInicio: "desc" }
  });
  res.json(rows);
});

capacitacionRouter.post("/historial", requireRoles("ADMIN", "RRHH"), async (req, res) => {
  const { idEmpleado, idCurso, fechaInicio, fechaFin, calificacion, estado, certificadoUrl } = req.body ?? {};
  if (!idEmpleado || !idCurso || !fechaInicio) {
    res.status(400).json({ error: "idEmpleado, idCurso y fechaInicio requeridos" });
    return;
  }
  const created = await prisma.historialCapacitacion.create({
    data: {
      idEmpleado: Number(idEmpleado),
      idCurso: Number(idCurso),
      fechaInicio: new Date(fechaInicio),
      fechaFin: fechaFin != null ? new Date(fechaFin) : null,
      calificacion: calificacion != null ? Number(calificacion) : null,
      estado: estado != null ? String(estado) : "PROGRAMADO",
      certificadoUrl: certificadoUrl != null ? String(certificadoUrl) : null
    },
    include: { curso: true }
  });
  res.status(201).json(created);
});

capacitacionRouter.put("/historial/:id", requireRoles("ADMIN", "RRHH"), async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body ?? {};
  const updated = await prisma.historialCapacitacion.update({
    where: { idHistorial: id },
    data: {
      ...(b.fechaInicio != null ? { fechaInicio: new Date(b.fechaInicio) } : {}),
      ...(b.fechaFin !== undefined ? { fechaFin: b.fechaFin ? new Date(b.fechaFin) : null } : {}),
      ...(b.calificacion !== undefined ? { calificacion: b.calificacion != null ? Number(b.calificacion) : null } : {}),
      ...(b.estado != null ? { estado: String(b.estado) } : {}),
      ...(b.certificadoUrl !== undefined
        ? { certificadoUrl: b.certificadoUrl ? String(b.certificadoUrl) : null }
        : {})
    },
    include: { curso: true }
  });
  res.json(updated);
});
