# MIRODAGEJE — HRM y Nómina

Monorepo **npm workspaces** con **API en Node.js + TypeScript** (Express, JWT, Prisma) y **web en React + Vite**. La base de datos objetivo es **Microsoft SQL Server**.

| Paquete | Descripción |
| --- | --- |
| `backend/` | API REST bajo `/api`, Prisma, semilla de datos |
| `frontend/` | SPA con proxy de desarrollo hacia la API |

## Modelo de datos (ERD)

Las tablas siguen el diagrama funcional:

| Tabla | Descripción |
| --- | --- |
| `departamentos` | Catálogo de departamentos |
| `puestos` | Puestos de trabajo (cada puesto pertenece a un departamento, `id_departamento`) |
| `empleados` | Expediente central (datos personales, departamento, puesto, salario base, estado `ACTIVO`/`INACTIVO`) |
| `asistencias` | Registros de asistencia (fecha, horas, estado) |
| `incidencias` | Vacaciones, permisos, licencias, faltas, etc. |
| `usuarios` | Acceso al sistema (usuario, contraseña con hash bcrypt, rol `ADMIN`/`RRHH`/`EMPLEADO`) |
| `nominas` | Cabecera de periodo (fechas de periodo y pago) |
| `detalle_nomina` | Líneas por empleado (salario base, bonificaciones, deducciones, salario neto) |

Módulo de **bonificaciones** (catálogo y asignaciones por empleado):

| Tabla | Descripción |
| --- | --- |
| `tipos_bonificacion` | Catálogo de tipos de bono (`ACTIVO`/`INACTIVO`) |
| `asignaciones_bonificacion` | Montos asignados a empleados por tipo y fecha |

Módulo de **capacitación / expediente**:

| Tabla | Descripción |
| --- | --- |
| `cursos_capacitacion` | Catálogo de cursos |
| `historial_capacitacion` | Cursos por empleado (fechas, calificación, estado, URL de certificado opcional) |

> La columna física de contraseña se mapea como `contrasena` (sin tilde) y almacena un **hash** (no texto plano). El ancho permite bcrypt.

En **SQL Server**, Prisma no usa tipos `ENUM` nativos: los campos equivalentes del diagrama son `VARCHAR` con valores controlados por la aplicación (misma semántica que el ERD).

## Requisitos

- Node.js 20+
- SQL Server accesible y cadena `DATABASE_URL` en formato Prisma, por ejemplo:

```env
DATABASE_URL="sqlserver://localhost:1433;database=mirodageje;user=sa;password=TuPassword;encrypt=true;trustServerCertificate=true"
JWT_SECRET="una-cadena-larga-y-secreta"
PORT=4000
```

Copie `backend/.env.example` a `backend/.env` y ajuste valores.

### Guía: `DATABASE_URL` (SQL Server + Prisma)

Use **una sola línea** entre comillas en `backend/.env`.

#### Autenticación de Windows (integrada)

Prisma usa el **usuario de Windows con el que ejecuta Node** (por ejemplo, la terminal o VS Code). Cadena típica:

```env
DATABASE_URL="sqlserver://localhost:1433;database=mirodageje;integratedSecurity=true;encrypt=true;trustServerCertificate=true"
```

En SQL Server (SSMS) debe existir un **inicio de sesión** de Windows para ese usuario (o un grupo del dominio) y permisos sobre la base `mirodageje` (o la que indique en `database=`). Si no, verá error de inicio de sesión al ejecutar migraciones de Prisma.

Instancia con nombre, por ejemplo `LAPTOP-XXX\SQLEXPRESS` y puerto TCP `49152`:

```env
DATABASE_URL="sqlserver://localhost\\SQLEXPRESS:49152;database=mirodageje;integratedSecurity=true;encrypt=true;trustServerCertificate=true"
```

(En el `.env`, la barra invertida del nombre de instancia va **doblada**: `\\`.)

#### Autenticación SQL (usuario y contraseña)

Formato base:

```env
DATABASE_URL="sqlserver://EQUIPO:PUERTO;database=NOMBRE_BD;user=USUARIO;password=CONTRASENA;encrypt=true;trustServerCertificate=true"
```

| Situación | Qué poner en `EQUIPO:PUERTO` |
| --- | --- |
| Instancia **predeterminada** en el mismo PC | `localhost:1433` (si TCP está en 1433) |
| **SQL Express** con nombre de instancia | `localhost\SQLEXPRESS` → en la URL use **doble barra invertida**: `localhost\\SQLEXPRESS` y el **puerto TCP** que vea en el *Administrador de configuración de SQL Server* (a veces **no** es 1433). Ejemplo: `localhost\\SQLEXPRESS:49152` |
| Servidor en otra máquina | `IP_O_NOMBRE:PUERTO` |

**Contraseña con símbolos** (`;`, `@`, `#`, `!`, etc.): si Prisma falla al conectar, codifique esos caracteres en la URL (por ejemplo `;` → `%3B`, `@` → `%40`) o use una contraseña temporal solo letras y números para probar.

**Autenticación SQL (usuario + contraseña)** debe estar activa si usa `user`/`password` (no es autenticación Windows pura). En SSMS: propiedades del servidor → **Seguridad** → *Modo de autentificación de SQL Server y Windows*. Si usa `sa`, asegúrese de que la cuenta **sa** esté **habilitada** y tenga contraseña definida.

**Probar credenciales** (ajuste `-S`, usuario y contraseña):

```powershell
sqlcmd -S localhost,1433 -U sa -P "SU_CONTRASENA" -Q "SELECT @@VERSION"
```

Si eso funciona, copie el mismo servidor, usuario y contraseña a `DATABASE_URL`. Luego cree la base si no existe (`CREATE DATABASE mirodageje`) o deje que las migraciones trabajen sobre la base indicada en `database=`.

**Docker** (`docker-compose.yml` en la raíz): el contenedor usa la variable de entorno `MSSQL_SA_PASSWORD` con el valor de ejemplo documentado en `backend/.env.example` (opción C). Si ya tiene otro SQL escuchando en **1433**, cambie el mapeo de puertos en Compose y use ese puerto en la URL.

## Puesta en marcha

Desde la **raíz del repositorio**:

```bash
npm install
cd backend && npx prisma generate && npx prisma migrate dev --name init && npx prisma db seed
cd ..
npm run dev
```

En proyectos ya migrados puede omitir `--name init` o usar un nombre descriptivo para nuevas migraciones.

**Scripts útiles en la raíz** (equivalentes parciales):

| Script | Acción |
| --- | --- |
| `npm run dev` | API + Vite en paralelo |
| `npm run build` | Compila backend y frontend |
| `npm run db:generate` | `prisma generate` en el workspace backend |
| `npm run db:migrate` | `prisma migrate dev` en el workspace backend |
| `npm run db:seed` | `prisma db seed` en el workspace backend |
| `npm run test` | Pruebas Jest del backend |

- API: `http://localhost:4000/api/health`
- Web: `http://localhost:5173` (proxy a `/api`)

Usuarios de demostración (semilla): exactamente **tres** inicios de sesión, cada uno ligado a su propio expediente de empleado:

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| `admin` | `Admin123!` | ADMIN |
| `rrhh` | `Rrhh123!` | RRHH |
| `empleado` | `Empleado123!` | EMPLEADO |

### Interfaz web por rol

- **Empleado**: **Mi expediente**, **Mi asistencia** y **Capacitaciones** (expediente y cursos en modo acorde al permiso de cada pantalla).
- **RRHH** y **admin**: **Empleados**, **Incidencias**, **Capacitaciones**, **Catálogos** (departamentos y puestos), **Bonificaciones** (tipos y asignaciones), **Nómina**, **Recibos / portal** (vista tipo ESS para consultar recibos por empleado) y, solo **admin**, **Usuarios** del sistema.

Rutas API principales (todas bajo prefijo `/api`): `auth`, `departamentos`, `puestos`, `empleados`, `asistencias`, `incidencias`, `nominas`, `capacitacion`, `usuarios`, `bonificaciones`.

## Pruebas
```bash
npm run test
```

Incluye pruebas unitarias del cálculo simplificado de nómina (`calcularLineaNomina`).

## Nómina y cumplimiento

El endpoint `POST /api/nominas/:id/generar` recalcula el detalle usando tasas **parametrizables** (ISR, IMSS empleado, deducciones adicionales) y montos de bonificación por empleado (`bonificacionesPorEmpleado`, `bonificacionDefault` en el cuerpo de la petición). Esto cubre el flujo de **simulación** y actualización ante cambios normativos a nivel de parámetros. Las tablas de **bonificaciones** en base de datos sirven para registrar catálogo y asignaciones desde la aplicación; el cálculo del endpoint usa los valores enviados en la generación.

Funciones avanzadas (CFDI con firma, dispersión bancaria específica por banco, archivos IMSS/IVSS según país) requieren integraciones y certificados externos; la estructura de `nominas` / `detalle_nomina` está alineada al diagrama para extenderlas.

## Diagrama en el repositorio

La imagen del ERD quedó guardada en el almacenamiento del proyecto de Cursor; si desea versionarla en Git, cópiela a una carpeta `docs/` del repo.
