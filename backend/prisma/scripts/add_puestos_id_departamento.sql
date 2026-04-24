/*
  Añade id_departamento a [puestos], rellena datos y crea la FK (alineado con Prisma).

  Desde backend (con .env apuntando a su SQL Server):
    npx prisma db execute --schema prisma/schema.prisma --file prisma/scripts/add_puestos_id_departamento.sql

  O ejecute el archivo en SQL Server Management Studio.

  Debe existir al menos un departamento para asignar puestos sin empleados.
*/
SET NOCOUNT ON;

IF COL_LENGTH('dbo.puestos', 'id_departamento') IS NULL
  EXEC (N'ALTER TABLE dbo.puestos ADD id_departamento INT NULL');

EXEC (N'
UPDATE p
SET p.id_departamento = x.id_departamento
FROM dbo.puestos AS p
INNER JOIN (
  SELECT e.id_puesto, MIN(e.id_departamento) AS id_departamento
  FROM dbo.empleados AS e
  GROUP BY e.id_puesto
) AS x ON x.id_puesto = p.id_puesto
WHERE p.id_departamento IS NULL
');

EXEC (N'
UPDATE p
SET p.id_departamento = (
  SELECT TOP (1) d.id_departamento
  FROM dbo.departamentos AS d
  ORDER BY d.id_departamento
)
FROM dbo.puestos AS p
WHERE p.id_departamento IS NULL
');

EXEC (N'
IF EXISTS (SELECT 1 FROM dbo.puestos WHERE id_departamento IS NULL)
  THROW 50001, N''Quedan filas en puestos sin id_departamento. Cree al menos un departamento.'', 1;

ALTER TABLE dbo.puestos ALTER COLUMN id_departamento INT NOT NULL;

IF NOT EXISTS (
  SELECT 1
  FROM sys.foreign_keys AS fk
  INNER JOIN sys.tables AS t ON t.object_id = fk.parent_object_id
  WHERE t.name = N''puestos'' AND fk.name = N''FK_puestos_departamento''
)
BEGIN
  ALTER TABLE dbo.puestos WITH CHECK
    ADD CONSTRAINT FK_puestos_departamento FOREIGN KEY (id_departamento)
    REFERENCES dbo.departamentos (id_departamento);
END
');
