import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { serializeMaterialLog } from "../serialize";

export const materialsRouter = Router();
materialsRouter.use(requireAuth);

materialsRouter.get("/", async (req, res) => {
  const logs = await prisma.materialLog.findMany({
    where: { residentId: req.auth!.sub },
    orderBy: { createdAt: "desc" },
    include: { resident: true },
  });
  res.json(logs.map(serializeMaterialLog));
});

materialsRouter.post("/", async (req, res) => {
  const { title, description, photos } = req.body;
  if (!title) return res.status(400).json({ error: "missing_fields" });

  const log = await prisma.materialLog.create({
    data: {
      title,
      description,
      photos: JSON.stringify(photos || []),
      residentId: req.auth!.sub,
      status: "PENDING",
    },
    include: { resident: true },
  });

  res.status(201).json(serializeMaterialLog(log));
});
