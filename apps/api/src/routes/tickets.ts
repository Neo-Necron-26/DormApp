import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { serializeTicket } from "../serialize";
import { notifyUser } from "../notify";

export const ticketsRouter = Router();
ticketsRouter.use(requireAuth);

ticketsRouter.get("/", async (req, res) => {
  const { status, q, floor, residentId } = req.query as Record<string, string | undefined>;
  const isAdmin = req.auth!.role === "ADMIN";
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });

  let where: Record<string, unknown>;
  if (isAdmin) {
    where = { dormId: user?.dormId ?? 6 };
    if (residentId) where.residentId = residentId;
    if (floor) where.room = { startsWith: floor };
  } else if (user?.residentRole === "FLOOR_MONITOR" && floor) {
    // A floor monitor may only ever see their own floor's tickets, not pick another.
    where = { dormId: user.dormId, room: { startsWith: userFloor(user.room) } };
  } else {
    where = { residentId: req.auth!.sub };
  }
  if (status) where.status = status;
  if (isAdmin && q) {
    where.OR = [{ room: { contains: q } }, { id: { contains: q } }, { category: { contains: q } }];
  }

  const tickets = await prisma.ticket.findMany({ where, orderBy: { createdAt: "desc" }, include: { resident: true } });
  res.json(tickets.map(serializeTicket));
});

function userFloor(room: string): string {
  const m = /^(\d)\d{2,3}$/.exec(room);
  return m ? m[1] : room;
}

ticketsRouter.post("/", async (req, res) => {
  const { category, description, photos } = req.body;
  if (!category || !description) return res.status(400).json({ error: "missing_fields" });

  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) return res.status(404).json({ error: "not_found" });

  const ticket = await prisma.ticket.create({
    data: {
      category,
      description,
      photos: JSON.stringify(photos || []),
      dormId: user.dormId,
      room: user.room,
      residentId: user.id,
    },
    include: { resident: true },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN", dormId: user.dormId } });
  await Promise.all(
    admins.map((a) =>
      notifyUser({
        userId: a.id,
        type: "TICKET_STATUS",
        title: "Новая заявка на ремонт",
        body: `${user.fullName}, комната ${user.room}: ${category}`,
        linkType: "ticket",
        linkId: ticket.id,
      })
    )
  );

  res.status(201).json(serializeTicket(ticket));
});

ticketsRouter.patch("/:id", async (req, res) => {
  if (req.auth!.role !== "ADMIN") return res.status(403).json({ error: "forbidden" });
  const { status, comment } = req.body;
  const patch: Record<string, unknown> = {};
  if (status) patch.status = status;
  if (comment !== undefined) patch.comment = comment || null;

  const ticket = await prisma.ticket.update({ where: { id: req.params.id }, data: patch, include: { resident: true } });

  await notifyUser({
    userId: ticket.residentId,
    type: "TICKET_STATUS",
    title: "Статус заявки изменён",
    body: `${ticket.category}: ${ticket.status}${comment ? " — " + comment : ""}`,
    linkType: "ticket",
    linkId: ticket.id,
  });

  res.json(serializeTicket(ticket));
});
