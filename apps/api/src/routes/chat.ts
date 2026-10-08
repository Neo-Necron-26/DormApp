import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { getOrCreateChannel, getOrCreateDMChannel, dmPeerId } from "../chatService";
import { serializeChatMessage } from "../serialize";
import { notifyUsers } from "../notify";
import { emitToChannel } from "../sockets";
import type { ChatChannelSummary, ChatChannelType } from "@sfu/shared";

export const chatRouter = Router();
chatRouter.use(requireAuth);

function canPost(type: ChatChannelType, user: { role: string; residentRole: string | null }) {
  if (type === "CAMPUS" || type === "DORM" || type === "SECTION" || type === "DM") return true;
  if (type === "ANNOUNCEMENTS") return user.role === "ADMIN" || user.residentRole === "NEWS_EDITOR";
  if (type === "SFU_ANNOUNCEMENTS") return user.role === "ADMIN" || user.role === "LEADERSHIP";
  return false;
}

chatRouter.get("/channels", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) return res.status(404).json({ error: "not_found" });

  const specs: { type: ChatChannelType; dormId: number | null; section: string | null }[] = [
    { type: "DORM", dormId: user.dormId, section: null },
    { type: "ANNOUNCEMENTS", dormId: user.dormId, section: null },
    { type: "SFU_ANNOUNCEMENTS", dormId: null, section: null },
    { type: "CAMPUS", dormId: null, section: null },
  ];
  if (user.section) specs.unshift({ type: "SECTION", dormId: user.dormId, section: user.section });

  const summaries: ChatChannelSummary[] = [];
  for (const spec of specs) {
    const channel = await getOrCreateChannel(spec.type, spec.dormId, spec.section);
    const lastMessage = await prisma.chatMessage.findFirst({
      where: { channelId: channel.id },
      orderBy: { createdAt: "desc" },
      include: { author: true },
    });
    const read = await prisma.chatChannelRead.findUnique({
      where: { userId_channelId: { userId: user.id, channelId: channel.id } },
    });
    const unreadCount = await prisma.chatMessage.count({
      where: {
        channelId: channel.id,
        authorId: { not: user.id },
        createdAt: { gt: read?.lastReadAt ?? new Date(0) },
      },
    });
    summaries.push({
      id: channel.id,
      type: spec.type,
      dormId: spec.dormId,
      section: spec.section,
      canPost: canPost(spec.type, user),
      lastMessage: lastMessage ? serializeChatMessage(lastMessage) : null,
      unreadCount,
    });
  }

  const dmChannels = await prisma.chatChannel.findMany({
    where: { type: "DM", OR: [{ section: { startsWith: `${user.id}:` } }, { section: { endsWith: `:${user.id}` } }] },
  });
  for (const channel of dmChannels) {
    const peerId = dmPeerId(channel.section!, user.id);
    const peer = await prisma.user.findUnique({ where: { id: peerId } });
    if (!peer) continue;
    const lastMessage = await prisma.chatMessage.findFirst({
      where: { channelId: channel.id },
      orderBy: { createdAt: "desc" },
      include: { author: true },
    });
    const read = await prisma.chatChannelRead.findUnique({
      where: { userId_channelId: { userId: user.id, channelId: channel.id } },
    });
    const unreadCount = await prisma.chatMessage.count({
      where: { channelId: channel.id, authorId: { not: user.id }, createdAt: { gt: read?.lastReadAt ?? new Date(0) } },
    });
    summaries.push({
      id: channel.id,
      type: "DM",
      dormId: null,
      section: channel.section,
      canPost: true,
      lastMessage: lastMessage ? serializeChatMessage(lastMessage) : null,
      unreadCount,
      peer: { id: peer.id, fullName: peer.fullName, initials: peer.initials, verified: peer.verified },
    });
  }

  res.json(summaries);
});

chatRouter.get("/users/search", async (req, res) => {
  const query = req.query.q as string;
  if (!query || query.length < 2) return res.json([]);

  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) return res.status(404).json({ error: "not_found" });

  const users = await prisma.user.findMany({
    where: {
      fullName: { contains: query },
      id: { not: user.id },
    },
    take: 20,
  });

  res.json(
    users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      initials: u.initials,
      verified: u.verified,
      role: u.role,
      residentRole: u.residentRole,
    }))
  );
});

chatRouter.post("/dm/:userId", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  const peer = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!user || !peer) return res.status(404).json({ error: "not_found" });
  if (peer.id === user.id) return res.status(400).json({ error: "cannot_message_self" });

  const channel = await getOrCreateDMChannel(user.id, peer.id);
  const lastMessage = await prisma.chatMessage.findFirst({
    where: { channelId: channel.id },
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });

  const summary: ChatChannelSummary = {
    id: channel.id,
    type: "DM",
    dormId: null,
    section: channel.section,
    canPost: true,
    lastMessage: lastMessage ? serializeChatMessage(lastMessage) : null,
    unreadCount: 0,
    peer: { id: peer.id, fullName: peer.fullName, initials: peer.initials, verified: peer.verified },
  };
  res.json(summary);
});

chatRouter.get("/channels/:id/messages", async (req, res) => {
  const channel = await prisma.chatChannel.findUnique({ where: { id: req.params.id } });
  if (!channel) return res.status(404).json({ error: "not_found" });
  if (channel.type === "DM" && !(channel.section ?? "").split(":").includes(req.auth!.sub)) {
    return res.status(403).json({ error: "forbidden" });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { channelId: channel.id },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { author: true },
  });

  await prisma.chatChannelRead.upsert({
    where: { userId_channelId: { userId: req.auth!.sub, channelId: channel.id } },
    create: { userId: req.auth!.sub, channelId: channel.id },
    update: { lastReadAt: new Date() },
  });

  res.json(messages.map(serializeChatMessage));
});

chatRouter.post("/channels/:id/messages", async (req, res) => {
  const { text, photos, eventId } = req.body;
  if (!text) return res.status(400).json({ error: "missing_fields" });

  const channel = await prisma.chatChannel.findUnique({ where: { id: req.params.id } });
  if (!channel) return res.status(404).json({ error: "not_found" });

  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) return res.status(404).json({ error: "not_found" });

  if (!canPost(channel.type as ChatChannelType, user)) return res.status(403).json({ error: "forbidden" });
  if (channel.type === "SECTION" && (channel.dormId !== user.dormId || channel.section !== user.section) && user.role !== "ADMIN") {
    return res.status(403).json({ error: "forbidden" });
  }
  if ((channel.type === "DORM" || channel.type === "ANNOUNCEMENTS") && channel.dormId !== user.dormId && user.role !== "ADMIN") {
    return res.status(403).json({ error: "forbidden" });
  }
  if (channel.type === "SFU_ANNOUNCEMENTS" && user.role !== "ADMIN" && user.role !== "LEADERSHIP") {
    return res.status(403).json({ error: "forbidden" });
  }
  if (channel.type === "DM" && !(channel.section ?? "").split(":").includes(user.id)) {
    return res.status(403).json({ error: "forbidden" });
  }

  const message = await prisma.chatMessage.create({
    data: {
      channelId: channel.id,
      authorId: user.id,
      text,
      photos: JSON.stringify(photos || []),
      eventId: eventId || null,
    },
    include: { author: true },
  });

  const serialized = serializeChatMessage(message);
  emitToChannel(channel.id, "chat-message", serialized);

  if (channel.type === "ANNOUNCEMENTS" && channel.dormId) {
    const residents = await prisma.user.findMany({ where: { dormId: channel.dormId, role: "STUDENT" } });
    await notifyUsers(
      residents.map((r) => r.id),
      { type: "ANNOUNCEMENT", title: "📢 Объявление администрации", body: text.slice(0, 120), linkType: "announcement", linkId: message.id }
    );
  }

  res.status(201).json(serialized);
});
