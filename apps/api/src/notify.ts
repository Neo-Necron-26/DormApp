import { prisma } from "./prisma";
import { emitToUser } from "./sockets";

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  linkType?: string;
  linkId?: string;
}

export async function notifyUser(input: NotifyInput) {
  const notification = await prisma.notification.create({ data: input });
  emitToUser(input.userId, "notification", notification);
  return notification;
}

export async function notifyUsers(userIds: string[], input: Omit<NotifyInput, "userId">) {
  await Promise.all(userIds.map((userId) => notifyUser({ ...input, userId })));
}
