import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { authRouter } from "./routes/auth";
import { departamentosRouter } from "./routes/departamentos";
import { puestosRouter } from "./routes/puestos";
import { empleadosRouter } from "./routes/empleados";
import { asistenciasRouter } from "./routes/asistencias";
import { incidenciasRouter } from "./routes/incidencias";
import { nominasRouter } from "./routes/nominas";
import { capacitacionRouter } from "./routes/capacitacion";
import { usuariosRouter } from "./routes/usuarios";
import { bonificacionesRouter } from "./routes/bonificaciones";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "mirodageje-hrm-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/departamentos", departamentosRouter);
app.use("/api/puestos", puestosRouter);
app.use("/api/empleados", empleadosRouter);
app.use("/api/asistencias", asistenciasRouter);
app.use("/api/incidencias", incidenciasRouter);
app.use("/api/nominas", nominasRouter);
app.use("/api/capacitacion", capacitacionRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/bonificaciones", bonificacionesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "No encontrado" });
});

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API MIRODAGEJE en http://localhost:${env.port}`);
});
