import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { serializeNotification } from "../serialize";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.auth!.sub },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(notifications.map(serializeNotification));
});

notificationsRouter.patch("/:id/read", async (req, res) => {
  const notification = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.auth!.sub },
    data: { read: true },
  });
  if (notification.count === 0) return res.status(404).json({ error: "not_found" });
  const updated = await prisma.notification.findUnique({ where: { id: req.params.id } });
  res.json(serializeNotification(updated!));
});

notificationsRouter.patch("/read-all", async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.auth!.sub, read: false }, data: { read: true } });
  res.json({ ok: true });
});
