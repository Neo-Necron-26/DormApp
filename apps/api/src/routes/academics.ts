import { Router } from "express";
import { prisma } from "../prisma";
import { requireAdmin, requireAuth } from "../auth";
import { serializeGradeRecord, serializeScheduleEntry, serializeCertificateRequest, serializeInvoiceRequest } from "../serialize";
import { notifyUser } from "../notify";
import { DOCUMENT_TYPES, INVOICE_PURPOSES, weekParityAt } from "@sfu/shared";
import type { FundingType, SealType } from "@sfu/shared";

export const academicsRouter = Router();
academicsRouter.use(requireAuth);

academicsRouter.get("/grades", async (req, res) => {
  const records = await prisma.gradeRecord.findMany({
    where: { residentId: req.auth!.sub },
    orderBy: [{ sortOrder: "desc" }],
  });
  res.json(records.map(serializeGradeRecord));
});

academicsRouter.get("/schedule", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user?.studyGroup) return res.json({ entries: [], currentParity: weekParityAt(new Date()) });

  const entries = await prisma.scheduleEntry.findMany({
    where: { studyGroup: user.studyGroup },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  res.json({ entries: entries.map(serializeScheduleEntry), currentParity: weekParityAt(new Date()) });
});

// Institute/foreign-student documents and agreements route to the university's
// own systems (deanery/institute) — the dorm admin has no fulfillment role
// here, so unlike /invoices below there is no admin-scoped list or a PATCH to
// advance status. This only ever returns the caller's own requests.
academicsRouter.get("/certificates", async (req, res) => {
  const requests = await prisma.certificateRequest.findMany({
    where: { residentId: req.auth!.sub },
    orderBy: { createdAt: "desc" },
    include: { resident: true },
  });
  res.json(requests.map(serializeCertificateRequest));
});

academicsRouter.post("/certificates", async (req, res) => {
  const { type, comment, sealType } = req.body as { type?: string; comment?: string; sealType?: SealType };
  if (!type) return res.status(400).json({ error: "missing_fields" });

  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) return res.status(404).json({ error: "not_found" });

  const fundingType = user.fundingType as FundingType;
  const doc = DOCUMENT_TYPES.find((d) => d.label === type);
  if (!doc || (doc.fundingTypes !== "ALL" && !doc.fundingTypes.includes(fundingType))) {
    return res.status(400).json({ error: "type_not_allowed" });
  }
  if (doc.requiresSeal && sealType !== "OFFICIAL" && sealType !== "INSTITUTE") {
    return res.status(400).json({ error: "seal_type_required" });
  }

  const request = await prisma.certificateRequest.create({
    data: {
      type,
      category: doc.category,
      sealType: doc.requiresSeal ? sealType! : null,
      comment: comment || null,
      residentId: user.id,
    },
    include: { resident: true },
  });
  res.status(201).json(serializeCertificateRequest(request));
});

academicsRouter.get("/invoices", async (req, res) => {
  const isAdmin = req.auth!.role === "ADMIN";
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  const requests = await prisma.invoiceRequest.findMany({
    where: isAdmin ? { resident: { dormId: user?.dormId ?? 6 } } : { residentId: req.auth!.sub },
    orderBy: { createdAt: "desc" },
    include: { resident: true },
  });
  res.json(requests.map(serializeInvoiceRequest));
});

academicsRouter.post("/invoices", async (req, res) => {
  const { purpose, comment } = req.body as { purpose?: string; comment?: string };
  if (!purpose || !(INVOICE_PURPOSES as readonly string[]).includes(purpose)) {
    return res.status(400).json({ error: "invalid_purpose" });
  }

  const request = await prisma.invoiceRequest.create({
    data: { purpose, comment: comment || null, residentId: req.auth!.sub },
    include: { resident: true },
  });
  res.status(201).json(serializeInvoiceRequest(request));
});

academicsRouter.patch("/invoices/:id", requireAdmin, async (req, res) => {
  const { status, amount } = req.body as { status?: string; amount?: number };
  if (!status || !["REQUESTED", "READY", "PAID"].includes(status)) return res.status(400).json({ error: "invalid_status" });
  if (status === "READY" && !(typeof amount === "number" && amount > 0)) {
    return res.status(400).json({ error: "amount_required" });
  }

  const request = await prisma.invoiceRequest.update({
    where: { id: req.params.id },
    data: { status, ...(typeof amount === "number" ? { amount } : {}) },
    include: { resident: true },
  });

  if (status === "READY") {
    await notifyUser({
      userId: request.residentId,
      type: "INVOICE_STATUS",
      title: "Счёт готов",
      body: `Счёт на оплату «${request.purpose}» готов, можно забирать`,
      linkType: "invoice",
      linkId: request.id,
    });
  }

  res.json(serializeInvoiceRequest(request));
});
