import React, { useEffect, useState } from "react";
import { InvoiceRequest, InvoiceStatus } from "@sfu/shared";
import { api } from "../api";
import { useLang } from "../LangContext";
import { Badge, BadgeTone } from "../components/ui";

const INVOICE_NEXT: Record<InvoiceStatus, InvoiceStatus | null> = { REQUESTED: "READY", READY: "PAID", PAID: null };
const INVOICE_TONE: Record<InvoiceStatus, BadgeTone> = { REQUESTED: "warning", READY: "accent", PAID: "success" };
const INVOICE_KEY: Record<InvoiceStatus, "invoiceStatusRequested" | "invoiceStatusReady" | "invoiceStatusPaid"> = {
  REQUESTED: "invoiceStatusRequested",
  READY: "invoiceStatusReady",
  PAID: "invoiceStatusPaid",
};

export default function AccountingPage() {
  const { t } = useLang();
  const [requests, setRequests] = useState<InvoiceRequest[]>([]);
  const [settingAmountFor, setSettingAmountFor] = useState<InvoiceRequest | null>(null);
  const [amount, setAmount] = useState("");

  const load = () => api.invoices().then(setRequests);

  useEffect(() => {
    load();
  }, []);

  const advance = (r: InvoiceRequest) => {
    const next = INVOICE_NEXT[r.status];
    if (!next) return;
    if (next === "READY") {
      setAmount("");
      setSettingAmountFor(r);
      return;
    }
    api.updateInvoiceRequest(r.id, { status: next }).then(load);
  };

  const confirmReady = async () => {
    if (!settingAmountFor) return;
    const parsed = Number(amount.replace(/[^\d]/g, ""));
    if (!parsed || parsed <= 0) return;
    await api.updateInvoiceRequest(settingAmountFor.id, { status: "READY", amount: parsed });
    setSettingAmountFor(null);
    load();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ margin: 0 }}>{t("departmentAccounting")}</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {requests.length === 0 && <div className="card" style={{ color: "var(--mu)", fontSize: 13 }}>{t("noInvoices")}</div>}
        {requests.map((r) => {
          const next = INVOICE_NEXT[r.status];
          return (
            <div key={r.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{r.purpose}</div>
                {r.amount != null && (
                  <div style={{ fontSize: 12, color: "var(--mu)" }}>
                    {t("invoiceAmountLabel")}: {r.amount.toLocaleString("ru-RU")} ₽
                  </div>
                )}
                <div style={{ fontSize: 12, color: "var(--mu)" }}>
                  {r.resident.fullName} · {t("room").toLowerCase()} {r.resident.room} · {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Badge label={t(INVOICE_KEY[r.status])} tone={INVOICE_TONE[r.status]} />
                {next && (
                  <button className="btn-secondary" style={{ height: 32, fontSize: 12 }} onClick={() => advance(r)}>
                    → {t(INVOICE_KEY[next])}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {settingAmountFor && (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
            <div style={{ fontWeight: 700 }}>{t("setAmountTitle")}</div>
            <div style={{ fontSize: 12, color: "var(--mu)" }}>{settingAmountFor.purpose}</div>
            <input
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t("invoiceAmountPlaceholder")}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ height: 34, fontSize: 12 }} onClick={confirmReady} disabled={!amount}>
                {t("markReady")}
              </button>
              <button className="btn-secondary" style={{ height: 34, fontSize: 12 }} onClick={() => setSettingAmountFor(null)}>
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
