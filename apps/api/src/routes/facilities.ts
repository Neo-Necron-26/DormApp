import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { serializeFacility, serializeFacilityBooking } from "../serialize";
import type { FacilitySlot } from "@sfu/shared";

export const facilitiesRouter = Router();
facilitiesRouter.use(requireAuth);

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

facilitiesRouter.get("/", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  const facilities = await prisma.facility.findMany({ where: { dormId: user?.dormId ?? 6 } });
  res.json(facilities.map(serializeFacility));
});

facilitiesRouter.get("/:id/slots", async (req, res) => {
  const date = req.query.date as string | undefined;
  if (!date) return res.status(400).json({ error: "missing_date" });

  const facility = await prisma.facility.findUnique({ where: { id: req.params.id } });
  if (!facility) return res.status(404).json({ error: "not_found" });

  const bookings = await prisma.facilityBooking.findMany({ where: { facilityId: facility.id, date } });
  const bookedByTime = new Map(bookings.map((b) => [b.startTime, b.residentId]));

  const slots: FacilitySlot[] = [];
  let t = facility.openTime;
  while (t < facility.closeTime) {
    slots.push({ startTime: t, booked: bookedByTime.has(t), mine: bookedByTime.get(t) === req.auth!.sub });
    t = addMinutes(t, facility.slotMinutes);
  }
  res.json(slots);
});

facilitiesRouter.get("/bookings/mine", async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const bookings = await prisma.facilityBooking.findMany({
    where: { residentId: req.auth!.sub, date: { gte: today } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: { facility: true, resident: true },
  });
  res.json(bookings.map(serializeFacilityBooking));
});

facilitiesRouter.post("/:id/bookings", async (req, res) => {
  const { date, startTime } = req.body as { date?: string; startTime?: string };
  if (!date || !startTime) return res.status(400).json({ error: "missing_fields" });

  const facility = await prisma.facility.findUnique({ where: { id: req.params.id } });
  if (!facility) return res.status(404).json({ error: "not_found" });

  const existing = await prisma.facilityBooking.findUnique({
    where: { facilityId_date_startTime: { facilityId: facility.id, date, startTime } },
  });
  if (existing) return res.status(409).json({ error: "slot_taken" });

  const booking = await prisma.facilityBooking.create({
    data: { facilityId: facility.id, residentId: req.auth!.sub, date, startTime },
    include: { facility: true, resident: true },
  });
  res.status(201).json(serializeFacilityBooking(booking));
});

facilitiesRouter.delete("/bookings/:id", async (req, res) => {
  const booking = await prisma.facilityBooking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: "not_found" });
  if (booking.residentId !== req.auth!.sub && req.auth!.role !== "ADMIN") return res.status(403).json({ error: "forbidden" });

  await prisma.facilityBooking.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
