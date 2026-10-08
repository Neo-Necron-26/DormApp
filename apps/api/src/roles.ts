import type { NextFunction, Request, Response } from "express";
import { prisma } from "./prisma";

export const RESIDENT_ROLES = ["FLOOR_MONITOR", "INSPECTOR", "NEWS_EDITOR", "REGISTRAR"] as const;
export type ResidentRole = (typeof RESIDENT_ROLES)[number];

/** Admins always pass; a student passes only with the given resident role. */
export function requireStaffOrRole(role: ResidentRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.auth?.role === "ADMIN") return next();
    const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
    if (user?.residentRole === role) return next();
    return res.status(403).json({ error: "forbidden" });
  };
}
