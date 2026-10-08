import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Appeal, AppealStatus } from "@sfu/shared";
import { api } from "../api";
import { useLang } from "../LangContext";
import { Badge, BadgeTone, ModalCenter, PillFilter, Table } from "../components/ui";

const STATUS_TONE: Record<AppealStatus, BadgeTone> = { PENDING: "warning", IN_REVIEW: "accent", RESOLVED: "success" };

export default function AppealsPage() {
  const { t } = useLang();
  const STATUS_LABEL: Record<AppealStatus, string> = {
    PENDING: t("appealStatusPending"),
    IN_REVIEW: t("appealStatusInReview"),
    RESOLVED: t("appealStatusResolved"),
  };
  const [searchParams] = useSearchParams();
  const [allAppeals, setAllAppeals] = useState<Appeal[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Appeal | null>(null);
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.appeals().then(setAllAppeals);
    api.appeals({ status: status || undefined }).then(setAppeals);
  };

  useEffect(() => {
    load();
  }, [status]);

  const openAppeal = (a: Appeal) => {
    setSelected(a);
    setResponse(a.response || "");
  };

  // Deep-link support: the Overview activity feed can open an appeal directly via ?appealId=.
  useEffect(() => {
    const id = searchParams.get("appealId");
    if (id && allAppeals.length > 0) {
      const a = allAppeals.find((x) => x.id === id);
      if (a) openAppeal(a);
    }
  }, [searchParams, allAppeals]);

  const respond = async (resolve: boolean) => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.respondAppeal(selected.id, { status: resolve ? "RESOLVED" : "IN_REVIEW", response });
      setSelected(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const countOf = (s: AppealStatus | "") => (s === "" ? allAppeals.length : allAppeals.filter((a) => a.status === s).length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ margin: 0 }}>{t("appeals")}</h1>
      <PillFilter
        value={status}
        onChange={setStatus}
        options={[
          { value: "", label: "Все", count: countOf("") },
          { value: "PENDING", label: STATUS_LABEL.PENDING, count: countOf("PENDING") },
          { value: "IN_REVIEW", label: STATUS_LABEL.IN_REVIEW, count: countOf("IN_REVIEW") },
          { value: "RESOLVED", label: STATUS_LABEL.RESOLVED, count: countOf("RESOLVED") },
        ]}
      />

      <Table
        rowKey={(a) => a.id}
        rows={appeals}
        onRowClick={openAppeal}
        columns={[
          { key: "id", label: "№", render: (a) => <span className="mono">{a.id.slice(-6).toUpperCase()}</span> },
          { key: "topic", label: t("appealTopic"), render: (a) => a.topic },
          { key: "text", label: "Текст", render: (a) => <span style={{ display: "inline-block", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.text}</span> },
          { key: "resident", label: "Жилец", render: (a) => (a.resident ? a.resident.fullName : "Анонимно") },
          { key: "status", label: "Статус", render: (a) => <Badge label={STATUS_LABEL[a.status]} tone={STATUS_TONE[a.status]} /> },
          { key: "date", label: "Дата", render: (a) => new Date(a.createdAt).toLocaleDateString("ru-RU") },
          { key: "bastion", label: "БАСТИОН", render: (a) => (a.routedToBastion ? "✅" : "—") },
        ]}
      />

      {selected && (
        <ModalCenter onClose={() => setSelected(null)}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{selected.topic}</div>
          <div style={{ fontSize: 13, color: "var(--mu)" }}>
            <span className="mono">№{selected.id.slice(-6).toUpperCase()}</span> ·{" "}
            {selected.resident ? `${selected.resident.fullName} · комната ${selected.resident.room}` : "Подано анонимно"}
          </div>
          <div style={{ fontSize: 14 }}>{selected.text}</div>
          <textarea className="textarea" value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Ответ жильцу" />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-secondary" onClick={() => respond(false)} disabled={saving}>
              {t("appealStatusInReview")}
            </button>
            <button className="btn-primary" style={{ width: 160 }} onClick={() => respond(true)} disabled={saving || !response}>
              {saving ? "…" : "Ответить и закрыть"}
            </button>
          </div>
        </ModalCenter>
      )}
    </div>
  );
}
