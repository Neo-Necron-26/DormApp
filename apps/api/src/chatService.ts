import { prisma } from "./prisma";
import { notifyUsers } from "./notify";
import { emitToChannel } from "./sockets";
import { serializeChatMessage } from "./serialize";

export async function getOrCreateChannel(type: string, dormId: number | null, section: string | null) {
  const existing = await prisma.chatChannel.findFirst({ where: { type, dormId, section } });
  if (existing) return existing;
  return prisma.chatChannel.create({ data: { type, dormId, section } });
}

export function dmKey(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join(":");
}

export function dmPeerId(channelSection: string, viewerId: string): string {
  const [a, b] = channelSection.split(":");
  return a === viewerId ? b : a;
}

export async function getOrCreateDMChannel(userIdA: string, userIdB: string) {
  return getOrCreateChannel("DM", null, dmKey(userIdA, userIdB));
}

export async function postAnnouncement(params: {
  dormId: number;
  authorId: string;
  text: string;
  photos?: string[];
  eventId?: string;
  notifyTitle: string;
}) {
  const channel = await getOrCreateChannel("ANNOUNCEMENTS", params.dormId, null);
  const message = await prisma.chatMessage.create({
    data: {
      channelId: channel.id,
      authorId: params.authorId,
      text: params.text,
      photos: JSON.stringify(params.photos || []),
      eventId: params.eventId,
    },
    include: { author: true },
  });

  emitToChannel(channel.id, "chat-message", serializeChatMessage(message));

  const residents = await prisma.user.findMany({ where: { dormId: params.dormId, role: "STUDENT" } });
  await notifyUsers(
    residents.map((r) => r.id),
    { type: "ANNOUNCEMENT", title: params.notifyTitle, body: params.text.slice(0, 120), linkType: "announcement", linkId: message.id }
  );

  return { message, deliveredCount: residents.length };
}
