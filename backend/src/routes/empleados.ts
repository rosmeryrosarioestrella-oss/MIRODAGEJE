import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware, requireRoles } from "../middleware/auth";

export const empleadosRouter = Router();
empleadosRouter.use(authMiddleware);

empleadosRouter.get("/", async (req, res) => {
  if (!req.auth) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  if (req.auth.rol === "EMPLEADO") {
    const one = await prisma.empleado.findUnique({
      where: { idEmpleado: req.auth.idEmpleado },
      include: {
        departamento: true,
        puesto: true,
        asistencias: { orderBy: { fecha: "desc" }, take: 30 },
        incidencias: { orderBy: { fechaInicio: "desc" }, take: 20 },
        historialesCapacitacion: { include: { curso: true }, orderBy: { fechaInicio: "desc" } }
      }
    });
    res.json(one ? [one] : []);
    return;
  }
  if (req.auth.rol !== "ADMIN" && req.auth.rol !== "RRHH") {
    res.status(403).json({ error: "Permisos insuficientes" });
    return;
  }
  const rows = await prisma.empleado.findMany({
    orderBy: { apellido: "asc" },
    include: { departamento: true, puesto: true }
  });
  res.json(rows);
});

empleadosRouter.get("/:id/expediente", requireRoles("ADMIN", "RRHH", "EMPLEADO"), async (req, res) => {
  const id = Number(req.params.id);
  if (req.auth?.rol === "EMPLEADO" && id !== req.auth.idEmpleado) {
    res.status(403).json({ error: "Solo puede ver su propio expediente" });
    return;
  }

  const empleado = await prisma.empleado.findUnique({
    where: { idEmpleado: id },
    include: {
      departamento: true,
      puesto: true,
      asistencias: { orderBy: { fecha: "desc" }, take: 60 },
      incidencias: { orderBy: { fechaInicio: "desc" } },
      historialesCapacitacion: { include: { curso: true }, orderBy: { fechaInicio: "desc" } },
      detallesNomina: {
        take: 24,
        orderBy: { idDetalle: "desc" },
        include: { nomina: true }
      }
    }
  });
  if (!empleado) {
    res.status(404).json({ error: "Empleado no encontrado" });
    return;
  }
  res.json(empleado);
});

empleadosRouter.post("/", requireRoles("ADMIN", "RRHH"), async (req, res) => {
  const {
    nombre,
    apellido,
    cedula,
    email,
    telefono,
    fechaIngreso,
    idDepartamento,
    idPuesto,
    salarioBase,
    estado
  } = req.body ?? {};

  if (
    !nombre ||
    !apellido ||
    !cedula ||
    !email ||
    !fechaIngreso ||
    !idDepartamento ||
    !idPuesto ||
    salarioBase === undefined
  ) {
    res.status(400).json({ error: "Faltan campos obligatorios" });
    return;
  }

  const idDep = Number(idDepartamento);
  const idPue = Number(idPuesto);
  const puesto = await prisma.puesto.findUnique({ where: { idPuesto: idPue } });
  if (!puesto || puesto.idDepartamento !== idDep) {
    res.status(400).json({ error: "El puesto debe pertenecer al departamento seleccionado" });
    return;
  }

  const created = await prisma.empleado.create({
    data: {
      nombre: String(nombre),
      apellido: String(apellido),
      cedula: String(cedula),
      email: String(email),
      telefono: telefono ? String(telefono) : null,
      fechaIngreso: new Date(fechaIngreso),
      idDepartamento: idDep,
      idPuesto: idPue,
      salarioBase: Number(salarioBase),
      estado: (estado as string) ?? "ACTIVO"
    },
    include: { departamento: true, puesto: true }
  });
  res.status(201).json(created);
});

empleadosRouter.put("/:id", requireRoles("ADMIN", "RRHH"), async (req, res) => {
  const id = Number(req.params.id);
  const data = req.body ?? {};
  const existing = await prisma.empleado.findUnique({ where: { idEmpleado: id } });
  if (!existing) {
    res.status(404).json({ error: "Empleado no encontrado" });
    return;
  }
  const nextDep = data.idDepartamento != null ? Number(data.idDepartamento) : existing.idDepartamento;
  const nextPuesto = data.idPuesto != null ? Number(data.idPuesto) : existing.idPuesto;
  const puestoRow = await prisma.puesto.findUnique({ where: { idPuesto: nextPuesto } });
  if (!puestoRow || puestoRow.idDepartamento !== nextDep) {
    res.status(400).json({ error: "El puesto debe pertenecer al departamento del empleado" });
    return;
  }
  const updated = await prisma.empleado.update({
    where: { idEmpleado: id },
    data: {
      ...(data.nombre != null ? { nombre: String(data.nombre) } : {}),
      ...(data.apellido != null ? { apellido: String(data.apellido) } : {}),
      ...(data.cedula != null ? { cedula: String(data.cedula) } : {}),
      ...(data.email != null ? { email: String(data.email) } : {}),
      ...(data.telefono !== undefined ? { telefono: data.telefono ? String(data.telefono) : null } : {}),
      ...(data.fechaIngreso != null ? { fechaIngreso: new Date(data.fechaIngreso) } : {}),
      ...(data.idDepartamento != null ? { idDepartamento: Number(data.idDepartamento) } : {}),
      ...(data.idPuesto != null ? { idPuesto: Number(data.idPuesto) } : {}),
      ...(data.salarioBase != null ? { salarioBase: Number(data.salarioBase) } : {}),
      ...(data.estado != null ? { estado: String(data.estado) } : {})
    },
    include: { departamento: true, puesto: true }
  });
  res.json(updated);
});
