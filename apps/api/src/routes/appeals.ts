import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { serializeAppeal } from "../serialize";
import { notifyUser } from "../notify";

export const appealsRouter = Router();
appealsRouter.use(requireAuth);

appealsRouter.get("/", async (req, res) => {
  const { status } = req.query as Record<string, string | undefined>;
  const isAdmin = req.auth!.role === "ADMIN";

  const where: Record<string, unknown> = isAdmin ? { dormId: 6 } : { residentId: req.auth!.sub };
  if (status) where.status = status;

  const appeals = await prisma.appeal.findMany({ where, orderBy: { createdAt: "desc" }, include: { resident: true } });
  res.json(appeals.map(serializeAppeal));
});

appealsRouter.post("/", async (req, res) => {
  const { topic, text, anonymous } = req.body;
  if (!topic || !text) return res.status(400).json({ error: "missing_fields" });

  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) return res.status(404).json({ error: "not_found" });

  const appeal = await prisma.appeal.create({
    data: { topic, text, anonymous: !!anonymous, photos: req.body.photos || [], dormId: user.dormId, residentId: user.id },
    include: { resident: true },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN", dormId: user.dormId } });
  await Promise.all(
    admins.map((a) =>
      notifyUser({
        userId: a.id,
        type: "APPEAL_RESPONSE",
        title: "Новое заявление",
        body: `${topic}${anonymous ? " (анонимно)" : ` — ${user.fullName}`}`,
        linkType: "appeal",
        linkId: appeal.id,
      })
    )
  );

  res.status(201).json(serializeAppeal(appeal));
});

appealsRouter.patch("/:id", async (req, res) => {
  if (req.auth!.role !== "ADMIN") return res.status(403).json({ error: "forbidden" });
  const { status, response } = req.body;
  const patch: Record<string, unknown> = {};
  if (status) {
    patch.status = status;
    if (status === "RESOLVED") patch.respondedAt = new Date();
  }
  if (response !== undefined) patch.response = response || null;

  const appeal = await prisma.appeal.update({ where: { id: req.params.id }, data: patch, include: { resident: true } });

  await notifyUser({
    userId: appeal.residentId,
    type: "APPEAL_RESPONSE",
    title: "Ответ по заявлению",
    body: response || `Статус: ${appeal.status}`,
    linkType: "appeal",
    linkId: appeal.id,
  });

  res.json(serializeAppeal(appeal));
});
