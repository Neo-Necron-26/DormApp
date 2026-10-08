import { Router } from "express";
import { requireAuth } from "../auth";
import { prisma } from "../prisma";
import { dormsWithDistance } from "@sfu/shared";

export const dormsRouter = Router();
dormsRouter.use(requireAuth);

dormsRouter.get("/", async (req, res) => {
  const lang = (req.query.lang as "ru" | "en") || "ru";
  const dorms = dormsWithDistance(lang);
  const counts = await prisma.listing.groupBy({ by: ["dormId"], _count: true });
  const countMap = Object.fromEntries(counts.map((c) => [c.dormId, c._count]));
  res.json(dorms.map((d) => ({ ...d, listingsCount: countMap[d.id] || 0 })));
});
