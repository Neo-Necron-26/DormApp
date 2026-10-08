import { Router } from "express";
import { prisma } from "../prisma";
import { requireAdmin, requireAuth } from "../auth";
import { serializeMenuItem } from "../serialize";

export const canteenRouter = Router();
canteenRouter.use(requireAuth);

canteenRouter.get("/menu", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  const items = await prisma.menuItem.findMany({
    where: { dormId: user?.dormId ?? 6 },
    orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }, { sortOrder: "asc" }],
  });
  res.json(items.map(serializeMenuItem));
});

canteenRouter.post("/menu", requireAdmin, async (req, res) => {
  const { dayOfWeek, mealType, name, price } = req.body as { dayOfWeek?: number; mealType?: string; name?: string; price?: number };
  if (dayOfWeek == null || !mealType || !name || price == null) return res.status(400).json({ error: "missing_fields" });

  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  const item = await prisma.menuItem.create({
    data: { dormId: user?.dormId ?? 6, dayOfWeek, mealType, name, price },
  });
  res.status(201).json(serializeMenuItem(item));
});

canteenRouter.delete("/menu/:id", requireAdmin, async (req, res) => {
  await prisma.menuItem.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
