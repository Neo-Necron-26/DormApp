import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { requireStaffOrRole } from "../roles";
import { serializeEvent } from "../serialize";
import { postAnnouncement } from "../chatService";

export const eventsRouter = Router();
eventsRouter.use(requireAuth);

eventsRouter.get("/", async (req, res) => {
  const dormId = Number(req.query.dormId) || 6;
  const includePast = req.query.includePast === "1" && req.auth!.role === "ADMIN";
  const events = await prisma.event.findMany({
    where: { dormId, ...(includePast ? {} : { date: { gte: new Date() } }) },
    orderBy: { date: includePast ? "desc" : "asc" },
    take: includePast ? 100 : 8,
  });
  res.json(events.map(serializeEvent));
});

eventsRouter.post("/", requireStaffOrRole("NEWS_EDITOR"), async (req, res) => {
  const { title, description, date, photos, isSfu } = req.body;
  if (!title || !description || !date) return res.status(400).json({ error: "missing_fields" });

  const author = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!author) return res.status(404).json({ error: "not_found" });

  const event = await prisma.event.create({
    data: {
      title,
      description,
      date: new Date(date),
      dormId: author.dormId,
      isSfu: !!isSfu,
      photos: JSON.stringify(photos || []),
    },
  });

  const { deliveredCount } = await postAnnouncement({
    dormId: author.dormId,
    authorId: author.id,
    text: `📅 ${title}\n${description}`,
    photos,
    eventId: event.id,
    notifyTitle: "Новое мероприятие",
  });

  res.status(201).json({ ...serializeEvent(event), deliveredCount });
});
