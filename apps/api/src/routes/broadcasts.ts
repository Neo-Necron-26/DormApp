import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { requireStaffOrRole } from "../roles";
import { getOrCreateChannel } from "../chatService";
import { serializeChatMessage } from "../serialize";
import { notifyUsers } from "../notify";
import { emitToChannel } from "../sockets";

export const broadcastsRouter = Router();
broadcastsRouter.use(requireAuth, requireStaffOrRole("NEWS_EDITOR"));

// Audience: "all" | "floor:<n>" | "room:<room>"
broadcastsRouter.post("/", async (req, res) => {
  const { title, text, audience, photos, eventId } = req.body;
  if (!title || !text) return res.status(400).json({ error: "missing_fields" });

  const author = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!author) return res.status(404).json({ error: "not_found" });

  const channel = await getOrCreateChannel("ANNOUNCEMENTS", author.dormId, null);
  const fullText = `${title}\n${text}`;
  const message = await prisma.chatMessage.create({
    data: { channelId: channel.id, authorId: author.id, text: fullText, photos: JSON.stringify(photos || []), eventId: eventId || null },
    include: { author: true },
  });
  emitToChannel(channel.id, "chat-message", serializeChatMessage(message));

  const audienceValue: string = audience || "all";
  const where: Record<string, unknown> = { dormId: author.dormId, role: "STUDENT" };
  if (audienceValue.startsWith("floor:")) {
    const floor = audienceValue.split(":")[1];
    where.room = { startsWith: floor };
  } else if (audienceValue.startsWith("room:")) {
    where.room = audienceValue.split(":")[1];
  }
  const recipients = await prisma.user.findMany({ where });

  await notifyUsers(
    recipients.map((r) => r.id),
    { type: "ANNOUNCEMENT", title: `📢 ${title}`, body: text.slice(0, 140), linkType: "announcement", linkId: message.id }
  );

  res.status(201).json({ message: serializeChatMessage(message), deliveredCount: recipients.length });
});
