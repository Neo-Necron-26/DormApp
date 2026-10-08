import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { requireStaffOrRole } from "../roles";
import { serializeRoomCheck } from "../serialize";
import { notifyUsers } from "../notify";

export const roomChecksRouter = Router();
roomChecksRouter.use(requireAuth);

roomChecksRouter.get("/", async (req, res) => {
  const { floor, room } = req.query as Record<string, string | undefined>;
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) return res.status(404).json({ error: "not_found" });

  const where: Record<string, unknown> = { dormId: user.role === "ADMIN" ? user.dormId : user.dormId };
  if (room) where.room = room;
  else if (floor) where.room = { startsWith: floor };

  const checks = await prisma.roomCheck.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { checkedBy: true },
  });
  res.json(checks.map(serializeRoomCheck));
});

roomChecksRouter.post("/", requireStaffOrRole("INSPECTOR"), async (req, res) => {
  const { room, result, notes } = req.body;
  if (!room || !result) return res.status(400).json({ error: "missing_fields" });

  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) return res.status(404).json({ error: "not_found" });

  const check = await prisma.roomCheck.create({
    data: { dormId: user.dormId, room, result, notes: notes || null, checkedById: user.id },
    include: { checkedBy: true },
  });

  if (result === "ISSUES") {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN", dormId: user.dormId } });
    await notifyUsers(
      admins.map((a) => a.id),
      {
        type: "ROOM_CHECK",
        title: "Замечания по проверке комнаты",
        body: `Комната ${room}: ${notes || "без комментария"}`,
        linkType: "roomcheck",
        linkId: check.id,
      }
    );
  }

  res.status(201).json(serializeRoomCheck(check));
});
