import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { serializeLostFoundItem } from "../serialize";
import { notifyUsers } from "../notify";

export const lostFoundRouter = Router();
lostFoundRouter.use(requireAuth);

lostFoundRouter.get("/", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  const items = await prisma.lostFoundItem.findMany({
    where: { dormId: user?.dormId ?? 6 },
    orderBy: { createdAt: "desc" },
    include: { resident: true },
  });
  res.json(items.map(serializeLostFoundItem));
});

lostFoundRouter.post("/", async (req, res) => {
  const { kind, title, location, photo } = req.body;
  if (!kind || !title) return res.status(400).json({ error: "missing_fields" });

  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) return res.status(404).json({ error: "not_found" });

  const item = await prisma.lostFoundItem.create({
    data: { kind, title, location: location || null, photo: photo || null, dormId: user.dormId, residentId: user.id },
    include: { resident: true },
  });

  const others = await prisma.user.findMany({ where: { dormId: user.dormId, role: "STUDENT", id: { not: user.id } } });
  await notifyUsers(
    others.map((o) => o.id),
    {
      type: "LOST_FOUND",
      title: kind === "LOST" ? "🔎 Пропажа в общежитии" : "🔎 Находка в общежитии",
      body: title,
      linkType: "lostfound",
      linkId: item.id,
    }
  );

  res.status(201).json({ ...serializeLostFoundItem(item), notifiedCount: others.length });
});
