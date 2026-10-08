import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { serializeUser } from "../serialize";
import type { PublicUser } from "@sfu/shared";

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get("/", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) return res.status(404).json({ error: "not_found" });
  res.json(serializeUser(user));
});

const EDITABLE_FIELDS: (keyof PublicUser)[] = [
  "phone",
  "email",
  "emergencyContactName",
  "emergencyContactPhone",
  "emergencyContactRelation",
  "medicalNotes",
  "maxId",
  "maxVisible",
  "carPlate",
  "inn",
  "snils",
  "birthDate",
  "passportReplacementConfirmed",
];

meRouter.patch("/", async (req, res) => {
  const patch: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in req.body) patch[key] = req.body[key];
  }
  const user = await prisma.user.update({ where: { id: req.auth!.sub }, data: patch });
  res.json(serializeUser(user));
});
