import { Router } from "express";
import { prisma } from "../prisma";
import { requireAdmin, requireAuth, requireLeadership } from "../auth";
import { serializeUser } from "../serialize";
import { DORMS } from "@sfu/shared";
import type { DormLeadershipOverview, ExplanatoryNote, LeadershipReport } from "@sfu/shared";

export const leadershipRouter = Router();
leadershipRouter.use(requireAuth);

function serializeReport(r: { id: string; dormId: number; title: string; text: string; read: boolean; createdAt: Date; author: { id: string; fullName: string } }): LeadershipReport {
  return {
    id: r.id,
    dormId: r.dormId,
    title: r.title,
    text: r.text,
    read: r.read,
    createdAt: r.createdAt.toISOString(),
    author: { id: r.author.id, fullName: r.author.fullName },
  };
}

function serializeNote(n: { id: string; dormId: number; room: string; residentName: string; reason: string; text: string; createdAt: Date; createdBy: { id: string; fullName: string } }): ExplanatoryNote {
  return {
    id: n.id,
    dormId: n.dormId,
    room: n.room,
    residentName: n.residentName,
    reason: n.reason,
    text: n.text,
    createdAt: n.createdAt.toISOString(),
    createdBy: { id: n.createdBy.id, fullName: n.createdBy.fullName },
  };
}

// Dorm admin ("комендант") writes a report/message up to university leadership.
leadershipRouter.post("/reports", requireAdmin, async (req, res) => {
  const { title, text } = req.body as { title?: string; text?: string };
  if (!title || !text) return res.status(400).json({ error: "missing_fields" });

  const author = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!author) return res.status(404).json({ error: "not_found" });

  const report = await prisma.leadershipReport.create({
    data: { dormId: author.dormId, title, text, authorId: author.id },
    include: { author: true },
  });
  res.status(201).json(serializeReport(report));
});

// A dorm admin can review the reports they themselves sent.
leadershipRouter.get("/reports/mine", requireAdmin, async (req, res) => {
  const reports = await prisma.leadershipReport.findMany({
    where: { authorId: req.auth!.sub },
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });
  res.json(reports.map(serializeReport));
});

leadershipRouter.get("/reports", requireLeadership, async (_req, res) => {
  const reports = await prisma.leadershipReport.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });
  res.json(reports.map(serializeReport));
});

leadershipRouter.patch("/reports/:id/read", requireLeadership, async (req, res) => {
  const report = await prisma.leadershipReport.update({
    where: { id: req.params.id },
    data: { read: true },
    include: { author: true },
  });
  res.json(serializeReport(report));
});

leadershipRouter.post("/explanatory-notes", requireAdmin, async (req, res) => {
  const { room, residentName, reason, text } = req.body as { room?: string; residentName?: string; reason?: string; text?: string };
  if (!room || !residentName || !reason || !text) return res.status(400).json({ error: "missing_fields" });

  const author = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!author) return res.status(404).json({ error: "not_found" });

  const note = await prisma.explanatoryNote.create({
    data: { dormId: author.dormId, room, residentName, reason, text, createdById: author.id },
    include: { createdBy: true },
  });
  res.status(201).json(serializeNote(note));
});

leadershipRouter.get("/explanatory-notes", async (req, res) => {
  const isLeadership = req.auth!.role === "LEADERSHIP";
  if (!isLeadership && req.auth!.role !== "ADMIN") return res.status(403).json({ error: "forbidden" });

  let dormId: number | undefined;
  if (isLeadership) {
    const q = req.query.dormId as string | undefined;
    dormId = q ? Number(q) : undefined;
  } else {
    const author = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
    dormId = author?.dormId;
  }

  const notes = await prisma.explanatoryNote.findMany({
    where: dormId ? { dormId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { createdBy: true },
  });
  res.json(notes.map(serializeNote));
});

// Lets a dorm admin find leadership to message, and leadership find a given
// dorm's admin to message — both directions of the "чат с руководством/
// администратором" feature reuse the existing DM chat channel infrastructure
// (see routes/chat.ts's `POST /api/chat/dm/:userId`), this just resolves who
// the "other side" of that DM should be.
leadershipRouter.get("/contacts", async (req, res) => {
  if (req.auth!.role === "ADMIN") {
    const leadership = await prisma.user.findMany({ where: { role: "LEADERSHIP" } });
    return res.json(leadership.map(serializeUser));
  }
  if (req.auth!.role === "LEADERSHIP") {
    const dormId = Number(req.query.dormId);
    if (!dormId) return res.status(400).json({ error: "missing_dormId" });
    const admins = await prisma.user.findMany({ where: { role: "ADMIN", dormId } });
    return res.json(admins.map(serializeUser));
  }
  res.status(403).json({ error: "forbidden" });
});

leadershipRouter.get("/dorms-overview", requireLeadership, async (_req, res) => {
  const overview: DormLeadershipOverview[] = await Promise.all(
    DORMS.map(async (dorm) => {
      const [residents, debtAgg, explanatoryNotesCount, openAppealsCount, pendingReportsCount] = await Promise.all([
        prisma.user.findMany({ where: { dormId: dorm.id, role: "STUDENT" }, select: { balance: true } }),
        prisma.user.aggregate({ where: { dormId: dorm.id, role: "STUDENT", balance: { lt: 0 } }, _sum: { balance: true } }),
        prisma.explanatoryNote.count({ where: { dormId: dorm.id } }),
        prisma.appeal.count({ where: { dormId: dorm.id, status: { not: "RESOLVED" } } }),
        prisma.leadershipReport.count({ where: { dormId: dorm.id, read: false } }),
      ]);
      return {
        dormId: dorm.id,
        nameRu: dorm.nameRu,
        residentsCount: residents.length,
        totalDebt: Math.abs(debtAgg._sum.balance ?? 0),
        explanatoryNotesCount,
        openAppealsCount,
        pendingReportsCount,
      };
    })
  );
  res.json(overview);
});
