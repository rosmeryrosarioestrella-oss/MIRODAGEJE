import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware, requireRoles } from "../middleware/auth";
import { prismaErrorMessage } from "../util/prismaErrorMessage";

export const puestosRouter = Router();
puestosRouter.use(authMiddleware);
puestosRouter.use(requireRoles("ADMIN", "RRHH"));

puestosRouter.get("/", async (req, res) => {
  try {
    const raw = req.query.idDepartamento;
    const idDepartamento =
      raw != null && String(raw).trim() !== "" && !Number.isNaN(Number(raw)) ? Number(raw) : undefined;
    const rows = await prisma.puesto.findMany({
      where: idDepartamento != null ? { idDepartamento } : undefined,
      orderBy: { nombre: "asc" },
      include: { departamento: { select: { idDepartamento: true, nombre: true } } }
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

puestosRouter.post("/", async (req, res) => {
  try {
    const nombre = String(req.body?.nombre ?? "").trim();
    const idDepartamento = req.body?.idDepartamento != null ? Number(req.body.idDepartamento) : NaN;
    if (!nombre || Number.isNaN(idDepartamento)) {
      res.status(400).json({ error: "nombre e idDepartamento son obligatorios" });
      return;
    }
    const dep = await prisma.departamento.findUnique({ where: { idDepartamento } });
    if (!dep) {
      res.status(400).json({ error: "Departamento no encontrado" });
      return;
    }
    const descripcion = req.body?.descripcion != null ? String(req.body.descripcion) : undefined;
    const created = await prisma.puesto.create({
      data: { nombre, descripcion, idDepartamento },
      include: { departamento: { select: { idDepartamento: true, nombre: true } } }
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

puestosRouter.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const nombre = String(req.body?.nombre ?? "").trim();
    if (!nombre) {
      res.status(400).json({ error: "nombre requerido" });
      return;
    }
    const descripcion = req.body?.descripcion != null ? String(req.body.descripcion) : null;
    const data: { nombre: string; descripcion: string | null; idDepartamento?: number } = { nombre, descripcion };
    if (req.body?.idDepartamento != null) {
      const newDep = Number(req.body.idDepartamento);
      if (Number.isNaN(newDep)) {
        res.status(400).json({ error: "idDepartamento inválido" });
        return;
      }
      const dep = await prisma.departamento.findUnique({ where: { idDepartamento: newDep } });
      if (!dep) {
        res.status(400).json({ error: "Departamento no encontrado" });
        return;
      }
      const conflict = await prisma.empleado.count({
        where: { idPuesto: id, NOT: { idDepartamento: newDep } }
      });
      if (conflict > 0) {
        res.status(400).json({
          error:
            "No puede cambiar el departamento del puesto: existen empleados con este cargo en otro departamento."
        });
        return;
      }
      data.idDepartamento = newDep;
    }
    const updated = await prisma.puesto.update({
      where: { idPuesto: id },
      data,
      include: { departamento: { select: { idDepartamento: true, nombre: true } } }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

puestosRouter.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.puesto.delete({ where: { idPuesto: id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});
