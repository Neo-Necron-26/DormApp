import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { requireAdmin, requireAuth } from "../auth";
import { requireStaffOrRole } from "../roles";
import { serializeUser, serializeListing, serializeTicket } from "../serialize";
import { notifyUsers } from "../notify";
import type { AdminStats, PublicUser, ActivityItem } from "@sfu/shared";

export const adminRouter = Router();
adminRouter.use(requireAuth);

adminRouter.get("/stats", requireAdmin, async (_req, res) => {
  const [studentsCount, listingsCount, verifiedCount, notLoggedInCount, openTicketsCount, pendingAppealsCount] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.listing.count(),
    prisma.user.count({ where: { role: "STUDENT", verified: true } }),
    prisma.user.count({ where: { role: "STUDENT", lastLoginAt: null } }),
    prisma.ticket.count({ where: { status: { not: "DONE" } } }),
    prisma.appeal.count({ where: { status: "PENDING" } }),
  ]);
  const stats: AdminStats = { studentsCount, listingsCount, verifiedCount, notLoggedInCount, openTicketsCount, pendingAppealsCount };
  res.json(stats);
});

adminRouter.get("/residents", requireAdmin, async (req, res) => {
  const { q } = req.query as Record<string, string | undefined>;
  const where: Record<string, unknown> = { role: "STUDENT" };
  if (q) {
    where.OR = [{ fullName: { contains: q } }, { room: { contains: q } }, { login: { contains: q } }];
  }
  const residents = await prisma.user.findMany({ where, orderBy: { room: "asc" } });
  res.json(residents.map(serializeUser));
});

adminRouter.get("/staff", requireAdmin, async (req, res) => {
  const requester = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  const staff = await prisma.user.findMany({ where: { role: "ADMIN", dormId: requester?.dormId ?? 6 } });
  res.json(staff.map(serializeUser));
});

const ADMIN_EDITABLE_FIELDS: (keyof PublicUser)[] = [
  "verified",
  "section",
  "residentRole",
  "room",
  "dormId",
  "checkoutDate",
  "emergencyContactRelation",
];

adminRouter.patch("/residents/:id", requireAdmin, async (req, res) => {
  const patch: Record<string, unknown> = {};
  for (const key of ADMIN_EDITABLE_FIELDS) {
    if (key in req.body) patch[key] = req.body[key];
  }
  if ("checkoutDate" in patch) {
    patch.checkoutDate = patch.checkoutDate ? new Date(patch.checkoutDate as string) : null;
  }
  const user = await prisma.user.update({ where: { id: req.params.id }, data: patch });

  if ("residentRole" in patch && patch.residentRole) {
    const { notifyUser } = await import("../notify");
    await notifyUser({
      userId: user.id,
      type: "ROLE_ASSIGNED",
      title: "Вам назначена роль",
      body: String(patch.residentRole),
    });
  }

  res.json(serializeUser(user));
});

adminRouter.post("/residents", requireStaffOrRole("REGISTRAR"), async (req, res) => {
  const { login, fullName, room, section, password } = req.body;
  if (!login || !fullName || !room || !password) return res.status(400).json({ error: "missing_fields" });

  const requester = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  const initials = fullName
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { login } });

  // A re-submitted login (the SSO-issued "contract" identifier) replaces the
  // existing record rather than erroring, per spec §4.6.
  const user = existing
    ? await prisma.user.update({
        where: { login },
        data: { passwordHash, fullName, initials, room, section: section || null },
      })
    : await prisma.user.create({
        data: {
          login,
          passwordHash,
          role: "STUDENT",
          fullName,
          initials,
          room,
          section: section || null,
          dormId: requester?.dormId ?? 6,
        },
      });

  res.status(existing ? 200 : 201).json({ ...serializeUser(user), replaced: !!existing });
});

adminRouter.get("/checkouts", requireAdmin, async (req, res) => {
  const requester = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  const residents = await prisma.user.findMany({
    where: { role: "STUDENT", dormId: requester?.dormId ?? 6, checkoutDate: { not: null } },
    orderBy: { checkoutDate: "asc" },
  });
  res.json(residents.map(serializeUser));
});

adminRouter.post("/checkouts/:id/remind", requireAdmin, async (req, res) => {
  const resident = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!resident || !resident.checkoutDate) return res.status(404).json({ error: "not_found" });

  await notifyUsers([resident.id], {
    type: "CHECKOUT_REMINDER",
    title: "Напоминание о выселении",
    body: `Не забудьте, что дата вашего выселения — ${resident.checkoutDate.toLocaleDateString("ru-RU")}. Обратитесь на вахту для оформления.`,
  });

  res.json({ ok: true });
});

adminRouter.get("/activity", requireAdmin, async (req, res) => {
  const requester = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  const dormId = requester?.dormId ?? 6;
  const take = 10;

  const [tickets, appeals, contactMessages, registrations, recentLogins, recentMessages] = await Promise.all([
    prisma.ticket.findMany({ where: { dormId }, orderBy: { createdAt: "desc" }, take, include: { resident: true } }),
    prisma.appeal.findMany({ where: { dormId }, orderBy: { createdAt: "desc" }, take, include: { resident: true } }),
    prisma.contactMessage.findMany({ where: { dormId }, orderBy: { createdAt: "desc" }, take, include: { resident: true } }),
    prisma.user.findMany({ where: { role: "STUDENT", dormId }, orderBy: { createdAt: "desc" }, take }),
    prisma.user.findMany({
      where: { role: "STUDENT", dormId, lastLoginAt: { not: null } },
      orderBy: { lastLoginAt: "desc" },
      take,
    }),
    prisma.chatMessage.findMany({
      where: { channel: { dormId } },
      orderBy: { createdAt: "desc" },
      take,
      include: { author: true },
    }),
  ]);

  const items: ActivityItem[] = [
    ...tickets.map((t) => ({
      id: t.id,
      type: "TICKET" as const,
      text: `${t.resident.fullName} (${t.room}): заявка на ремонт — ${t.category}`,
      createdAt: t.createdAt.toISOString(),
    })),
    ...appeals.map((a) => ({
      id: a.id,
      type: "APPEAL" as const,
      text: a.anonymous ? `Анонимное обращение: ${a.topic}` : `${a.resident.fullName}: обращение — ${a.topic}`,
      createdAt: a.createdAt.toISOString(),
    })),
    ...contactMessages.map((m) => ({
      id: m.id,
      type: "CONTACT" as const,
      text: `${m.resident.fullName} (${m.resident.room}): ${m.text}`,
      createdAt: m.createdAt.toISOString(),
    })),
    ...registrations.map((u) => ({
      id: u.id,
      type: "REGISTRATION" as const,
      text: `${u.fullName} зарегистрирован(а) в комнате ${u.room}`,
      createdAt: u.createdAt.toISOString(),
    })),
    ...recentLogins.map((u) => ({
      id: `login-${u.id}-${u.lastLoginAt!.getTime()}`,
      type: "LOGIN" as const,
      text: `${u.fullName} (${u.room}) вошёл(ла) в приложение`,
      createdAt: u.lastLoginAt!.toISOString(),
    })),
    ...recentMessages.map((m) => ({
      id: m.id,
      type: "MESSAGE" as const,
      text: `${m.author.fullName}: ${m.text.slice(0, 80)}`,
      createdAt: m.createdAt.toISOString(),
    })),
  ];

  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(items.slice(0, take));
});

adminRouter.get("/search", requireAdmin, async (req, res) => {
  const { q } = req.query as Record<string, string | undefined>;
  const requester = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  const dormId = requester?.dormId ?? 6;

  if (!q) return res.json({ residents: [], listings: [], tickets: [] });

  const [residents, listings, tickets] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT", dormId, OR: [{ fullName: { contains: q } }, { room: { contains: q } }, { login: { contains: q } }] },
      take: 10,
    }),
    prisma.listing.findMany({
      where: { dormId, OR: [{ title: { contains: q } }, { description: { contains: q } }] },
      take: 10,
      include: { seller: true, favorites: { select: { userId: true } } },
    }),
    prisma.ticket.findMany({
      where: { dormId, OR: [{ room: { contains: q } }, { category: { contains: q } }, { description: { contains: q } }] },
      take: 10,
      include: { resident: true },
    }),
  ]);

  res.json({
    residents: residents.map(serializeUser),
    listings: listings.map((l) => serializeListing(l)),
    tickets: tickets.map(serializeTicket),
  });
});
