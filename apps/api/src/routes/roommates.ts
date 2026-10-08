import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { serializeRoommateRequest } from "../serialize";

export const roommatesRouter = Router();
roommatesRouter.use(requireAuth);

roommatesRouter.get("/", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  const requests = await prisma.roommateRequest.findMany({
    where: { resident: { dormId: user?.dormId ?? 6 }, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: { resident: true },
  });
  res.json(requests.map(serializeRoommateRequest));
});

roommatesRouter.get("/mine", async (req, res) => {
  const requests = await prisma.roommateRequest.findMany({
    where: { residentId: req.auth!.sub },
    orderBy: { createdAt: "desc" },
    include: { resident: true },
  });
  res.json(requests.map(serializeRoommateRequest));
});

roommatesRouter.post("/", async (req, res) => {
  const { type, desiredRoom, description } = req.body as { type?: string; desiredRoom?: string; description?: string };
  if (!type || !description || !["SWAP", "SEEK_ROOMMATE"].includes(type)) return res.status(400).json({ error: "missing_fields" });

  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) return res.status(404).json({ error: "not_found" });

  const request = await prisma.roommateRequest.create({
    data: { type, room: user.room, desiredRoom: desiredRoom || null, description, residentId: user.id },
    include: { resident: true },
  });
  res.status(201).json(serializeRoommateRequest(request));
});

roommatesRouter.patch("/:id", async (req, res) => {
  const { status } = req.body as { status?: string };
  if (!status || !["ACTIVE", "CLOSED"].includes(status)) return res.status(400).json({ error: "invalid_status" });

  const existing = await prisma.roommateRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "not_found" });
  if (existing.residentId !== req.auth!.sub) return res.status(403).json({ error: "forbidden" });

  const request = await prisma.roommateRequest.update({
    where: { id: req.params.id },
    data: { status },
    include: { resident: true },
  });
  res.json(serializeRoommateRequest(request));
});
