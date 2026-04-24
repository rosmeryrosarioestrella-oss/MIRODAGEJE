import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { UsuarioRol } from "../types/roles";

export type AuthPayload = {
  sub: number;
  rol: UsuarioRol;
  idEmpleado: number;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "8h" });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as unknown as AuthPayload;
    req.auth = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

export function requireRoles(...roles: UsuarioRol[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
    if (!roles.includes(req.auth.rol)) {
      res.status(403).json({ error: "Permisos insuficientes" });
      return;
    }
    next();
  };
}
