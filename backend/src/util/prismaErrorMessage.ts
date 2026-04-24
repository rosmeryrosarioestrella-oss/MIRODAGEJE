import { Prisma } from "@prisma/client";

export function prismaErrorMessage(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return "Ese valor ya existe (debe ser único).";
    if (err.code === "P2003") return "Referencia inválida o hay registros que dependen de este dato.";
    if (err.code === "P2025") return "Registro no encontrado.";
    return err.message;
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return "Los datos no coinciden con el modelo de la base de datos. Revise que ejecutó las migraciones o prisma db push.";
  }
  if (err instanceof Error) return err.message;
  return "Error interno del servidor";
}
