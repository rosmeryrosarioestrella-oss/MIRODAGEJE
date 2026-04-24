import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { authMiddleware, requireRoles } from "../middleware/auth";
import { calcularLineaNomina } from "../services/nominaCalculo";

export const nominasRouter = Router();
nominasRouter.use(authMiddleware);

nominasRouter.get("/", requireRoles("ADMIN", "RRHH"), async (_req, res) => {
  const rows = await prisma.nomina.findMany({
    orderBy: { fechaPago: "desc" },
    include: { detalles: { include: { empleado: true } } }
  });
  res.json(rows);
});

nominasRouter.get("/:id", requireRoles("ADMIN", "RRHH"), async (req, res) => {
  const id = Number(req.params.id);
  const nomina = await prisma.nomina.findUnique({
    where: { idNomina: id },
    include: { detalles: { include: { empleado: true } } }
  });
  if (!nomina) {
    res.status(404).json({ error: "Nómina no encontrada" });
    return;
  }
  res.json(nomina);
});

nominasRouter.post("/", requireRoles("ADMIN", "RRHH"), async (req, res) => {
  const { fechaInicio, fechaFin, fechaPago } = req.body ?? {};
  if (!fechaInicio || !fechaFin || !fechaPago) {
    res.status(400).json({ error: "fechaInicio, fechaFin y fechaPago requeridas" });
    return;
  }
  const created = await prisma.nomina.create({
    data: {
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      fechaPago: new Date(fechaPago)
    }
  });
  res.status(201).json(created);
});

/**
 * Genera líneas en detalle_nomina para empleados ACTIVO (simulación o cierre).
 * Tasas configurables = actualización rápida ante cambios legales.
 */
nominasRouter.post("/:id/generar", requireRoles("ADMIN", "RRHH"), async (req, res) => {
  const idNomina = Number(req.params.id);
  const porcentajeIsr = Number(req.body?.porcentajeIsr ?? 10);
  const porcentajeImssEmpleado = Number(req.body?.porcentajeImssEmpleado ?? 3.5);
  const bonificacionesPorEmpleado = req.body?.bonificacionesPorEmpleado as Record<string, number> | undefined;
  const otrasDeduccionesPorEmpleado = req.body?.otrasDeduccionesPorEmpleado as Record<string, number> | undefined;

  const nomina = await prisma.nomina.findUnique({ where: { idNomina } });
  if (!nomina) {
    res.status(404).json({ error: "Nómina no encontrada" });
    return;
  }

  await prisma.detalleNomina.deleteMany({ where: { idNomina } });

  const empleados = await prisma.empleado.findMany({ where: { estado: "ACTIVO" } });

  const lineas = empleados.map((e) => {
    const salarioBase = Number(e.salarioBase);
    const bon = bonificacionesPorEmpleado?.[String(e.idEmpleado)] ?? Number(req.body?.bonificacionDefault ?? 0);
    const otras = otrasDeduccionesPorEmpleado?.[String(e.idEmpleado)] ?? Number(req.body?.otrasDeduccionesDefault ?? 0);
    const calc = calcularLineaNomina(salarioBase, {
      porcentajeIsr,
      porcentajeImssEmpleado,
      bonificaciones: bon,
      otrasDeducciones: otras
    });
    return {
      idNomina,
      idEmpleado: e.idEmpleado,
      salarioBase: new Prisma.Decimal(calc.salarioBase),
      bonificaciones: new Prisma.Decimal(calc.bonificaciones),
      deducciones: new Prisma.Decimal(calc.deducciones),
      salarioNeto: new Prisma.Decimal(calc.salarioNeto)
    };
  });

  await prisma.detalleNomina.createMany({ data: lineas });

  const full = await prisma.nomina.findUnique({
    where: { idNomina },
    include: { detalles: { include: { empleado: true } } }
  });
  res.json(full);
});

nominasRouter.delete("/:id", requireRoles("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.nomina.delete({ where: { idNomina: id } });
  res.status(204).end();
});
