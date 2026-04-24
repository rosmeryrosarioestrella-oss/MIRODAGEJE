import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware, requireRoles } from "../middleware/auth";
import { prismaErrorMessage } from "../util/prismaErrorMessage";

export const departamentosRouter = Router();
departamentosRouter.use(authMiddleware);
departamentosRouter.use(requireRoles("ADMIN", "RRHH"));

departamentosRouter.get("/", async (_req, res) => {
  try {
    const rows = await prisma.departamento.findMany({ orderBy: { nombre: "asc" } });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

departamentosRouter.post("/", async (req, res) => {
  try {
    const nombre = String(req.body?.nombre ?? "").trim();
    if (!nombre) {
      res.status(400).json({ error: "nombre requerido" });
      return;
    }
    const created = await prisma.departamento.create({ data: { nombre } });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

departamentosRouter.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const nombre = String(req.body?.nombre ?? "").trim();
    if (!nombre) {
      res.status(400).json({ error: "nombre requerido" });
      return;
    }
    const updated = await prisma.departamento.update({
      where: { idDepartamento: id },
      data: { nombre }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});

departamentosRouter.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.departamento.delete({ where: { idDepartamento: id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: prismaErrorMessage(err) });
  }
});
