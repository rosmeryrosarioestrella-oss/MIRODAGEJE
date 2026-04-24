import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.detalleNomina.deleteMany();
  await prisma.nomina.deleteMany();
  await prisma.asignacionBonificacion.deleteMany();
  await prisma.tipoBonificacion.deleteMany();
  await prisma.historialCapacitacion.deleteMany();
  await prisma.cursoCapacitacion.deleteMany();
  await prisma.asistencia.deleteMany();
  await prisma.incidencia.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.empleado.deleteMany();
  await prisma.puesto.deleteMany();
  await prisma.departamento.deleteMany();

  const dep = await prisma.departamento.create({ data: { nombre: "Capital Humano" } });
  const puestoAdmin = await prisma.puesto.create({
    data: {
      nombre: "Director de plataforma",
      descripcion: "Administración del sistema",
      idDepartamento: dep.idDepartamento
    }
  });
  const puestoRrhh = await prisma.puesto.create({
    data: {
      nombre: "Analista de RRHH",
      descripcion: "Expedientes y nómina",
      idDepartamento: dep.idDepartamento
    }
  });
  const puestoEmp = await prisma.puesto.create({
    data: {
      nombre: "Analista operativo",
      descripcion: "Operaciones",
      idDepartamento: dep.idDepartamento
    }
  });

  const empAdmin = await prisma.empleado.create({
    data: {
      nombre: "Carlos",
      apellido: "Administrador",
      cedula: "V-10000001",
      email: "admin.sistema@mirodageje.local",
      telefono: "0414-1000001",
      fechaIngreso: new Date("2023-06-01"),
      idDepartamento: dep.idDepartamento,
      idPuesto: puestoAdmin.idPuesto,
      salarioBase: 2500,
      estado: "ACTIVO"
    }
  });

  const empRrhh = await prisma.empleado.create({
    data: {
      nombre: "Laura",
      apellido: "Recursos",
      cedula: "V-10000002",
      email: "rrhh@mirodageje.local",
      telefono: "0414-1000002",
      fechaIngreso: new Date("2024-01-10"),
      idDepartamento: dep.idDepartamento,
      idPuesto: puestoRrhh.idPuesto,
      salarioBase: 1800,
      estado: "ACTIVO"
    }
  });

  const empOperativo = await prisma.empleado.create({
    data: {
      nombre: "María",
      apellido: "García",
      cedula: "V-10000003",
      email: "maria.garcia@mirodageje.local",
      telefono: "0414-1000003",
      fechaIngreso: new Date("2024-01-15"),
      idDepartamento: dep.idDepartamento,
      idPuesto: puestoEmp.idPuesto,
      salarioBase: 1200,
      estado: "ACTIVO"
    }
  });

  await prisma.usuario.create({
    data: {
      idEmpleado: empAdmin.idEmpleado,
      usuario: "admin",
      contrasena: await bcrypt.hash("Admin123!", 10),
      rol: "ADMIN"
    }
  });

  await prisma.usuario.create({
    data: {
      idEmpleado: empRrhh.idEmpleado,
      usuario: "rrhh",
      contrasena: await bcrypt.hash("Rrhh123!", 10),
      rol: "RRHH"
    }
  });

  await prisma.usuario.create({
    data: {
      idEmpleado: empOperativo.idEmpleado,
      usuario: "empleado",
      contrasena: await bcrypt.hash("Empleado123!", 10),
      rol: "EMPLEADO"
    }
  });

  const curso = await prisma.cursoCapacitacion.create({
    data: {
      nombre: "Inducción MIRODAGEJE",
      descripcion: "Cultura y sistemas",
      duracionHoras: 8
    }
  });

  await prisma.historialCapacitacion.create({
    data: {
      idEmpleado: empOperativo.idEmpleado,
      idCurso: curso.idCurso,
      fechaInicio: new Date("2024-01-16"),
      fechaFin: new Date("2024-01-17"),
      calificacion: 19,
      estado: "COMPLETADO",
      certificadoUrl: null
    }
  });

  await prisma.asistencia.create({
    data: {
      idEmpleado: empOperativo.idEmpleado,
      fecha: new Date("2026-04-01"),
      horaEntrada: "08:30",
      horaSalida: "17:00",
      estado: "NORMAL"
    }
  });

  await prisma.incidencia.create({
    data: {
      idEmpleado: empOperativo.idEmpleado,
      tipo: "VACACIONES",
      fechaInicio: new Date("2026-04-10"),
      fechaFin: new Date("2026-04-14"),
      descripcion: "Vacaciones programadas"
    }
  });

  const tipoProd = await prisma.tipoBonificacion.create({
    data: {
      nombre: "Productividad",
      descripcion: "Bono por metas del periodo",
      activo: "ACTIVO"
    }
  });
  await prisma.tipoBonificacion.create({
    data: {
      nombre: "Asistencia perfecta",
      descripcion: "Sin faltas ni retardos",
      activo: "ACTIVO"
    }
  });
  await prisma.asignacionBonificacion.create({
    data: {
      idEmpleado: empOperativo.idEmpleado,
      idTipoBonificacion: tipoProd.idTipoBonificacion,
      monto: 150,
      fecha: new Date("2026-04-01"),
      notas: "Ejemplo de asignación"
    }
  });

  // eslint-disable-next-line no-console
  console.log(
    "Seed listo — tres usuarios:\n" +
      "  admin      / Admin123!     (ADMIN)\n" +
      "  rrhh       / Rrhh123!      (RRHH)\n" +
      "  empleado   / Empleado123!  (EMPLEADO)"
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
