import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, requireAdmin } from "../auth";
import { serializeContactMessage } from "../serialize";
import { notifyUsers } from "../notify";

export const contactRouter = Router();
contactRouter.use(requireAuth);

// Admin-only inbox, scoped to the admin's dorm.
contactRouter.get("/", requireAdmin, async (req, res) => {
  const requester = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  const messages = await prisma.contactMessage.findMany({
    where: { dormId: requester?.dormId ?? 6 },
    orderBy: { createdAt: "desc" },
    include: { resident: true },
  });
  res.json(messages.map(serializeContactMessage));
});

contactRouter.post("/", async (req, res) => {
  const { text, photo } = req.body;
  if (!text) return res.status(400).json({ error: "missing_fields" });

  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) return res.status(404).json({ error: "not_found" });

  const message = await prisma.contactMessage.create({
    data: { text, photo: photo || null, dormId: user.dormId, residentId: user.id },
    include: { resident: true },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN", dormId: user.dormId } });
  await notifyUsers(
    admins.map((a) => a.id),
    {
      type: "MESSAGE",
      title: "Сообщение от жителя",
      body: `${user.fullName}, комната ${user.room}: ${text}`,
      linkType: "contact",
      linkId: message.id,
    }
  );

  res.status(201).json(serializeContactMessage(message));
});

contactRouter.patch("/:id", requireAdmin, async (req, res) => {
  const { read } = req.body;
  const message = await prisma.contactMessage.update({
    where: { id: req.params.id },
    data: { read: read !== undefined ? !!read : true },
    include: { resident: true },
  });
  res.json(serializeContactMessage(message));
});
