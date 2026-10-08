import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { serializePayment } from "../serialize";
import type { PaymentsSummary } from "@sfu/shared";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

const MONTHLY_RATE = 1450;

paymentsRouter.get("/", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) return res.status(404).json({ error: "not_found" });
  const history = await prisma.payment.findMany({ where: { residentId: user.id }, orderBy: { createdAt: "desc" } });
  const summary: PaymentsSummary = { balance: user.balance, monthlyRate: MONTHLY_RATE, history: history.map(serializePayment) };
  res.json(summary);
});

const PERIOD_MONTHS: Record<string, number> = { MONTH: 1, QUARTER: 3, YEAR: 12 };

paymentsRouter.post("/", async (req, res) => {
  const { period, method, amount: customAmount } = req.body;
  if (!period || !method || !(period in PERIOD_MONTHS)) return res.status(400).json({ error: "missing_fields" });

  // The development adapter records a local transaction. A production payment
  // provider must calculate and verify the final amount server-side.
  const defaultAmount = MONTHLY_RATE * PERIOD_MONTHS[period];
  const amount = Number.isFinite(Number(customAmount)) && Number(customAmount) > 0 ? Math.round(Number(customAmount)) : defaultAmount;
  const receiptNo = `СФУ-${Date.now().toString().slice(-8)}`;
  await prisma.payment.create({
    data: { amount, period, method, receiptNo, residentId: req.auth!.sub },
  });
  const user = await prisma.user.update({
    where: { id: req.auth!.sub },
    data: { balance: { increment: amount } },
  });

  const history = await prisma.payment.findMany({ where: { residentId: user.id }, orderBy: { createdAt: "desc" } });
  const summary: PaymentsSummary = { balance: user.balance, monthlyRate: MONTHLY_RATE, history: history.map(serializePayment) };
  res.status(201).json(summary);
});
