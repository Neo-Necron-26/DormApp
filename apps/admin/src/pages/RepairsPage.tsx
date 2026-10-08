import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Ticket, TicketStatus } from "@sfu/shared";
import { api, photoUrl } from "../api";
import { useLang } from "../LangContext";
import { Badge, BadgeTone, ModalCenter, PillFilter, Table } from "../components/ui";

const STATUS_TONE: Record<TicketStatus, BadgeTone> = { NEW: "warning", IN_PROGRESS: "accent", DONE: "success" };

export default function RepairsPage() {
  const { t } = useLang();
  const STATUS_LABEL: Record<TicketStatus, string> = {
    NEW: t("ticketStatusNew"),
    IN_PROGRESS: t("ticketStatusInProgress"),
    DONE: t("ticketStatusDone"),
  };
  const [searchParams] = useSearchParams();
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [nextStatus, setNextStatus] = useState<TicketStatus>("NEW");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const load = () => {
    api.tickets().then(setAllTickets);
    api.tickets({ status: status || undefined, q: q || undefined }).then(setTickets);
  };

  useEffect(() => {
    load();
  }, [status]);

  const openTicket = (tk: Ticket) => {
    setSelected(tk);
    setNextStatus(tk.status);
    setComment(tk.comment || "");
  };

  // Deep-link support: the Overview activity feed can open a ticket directly via ?ticketId=.
  useEffect(() => {
    const id = searchParams.get("ticketId");
    if (id && allTickets.length > 0) {
      const tk = allTickets.find((x) => x.id === id);
      if (tk) openTicket(tk);
    }
  }, [searchParams, allTickets]);

  const save = async () => {
    if (!selected) return;
    if (nextStatus !== selected.status && !window.confirm(`${t("confirmStatusChangeTitle")} ${t("confirmStatusChangeBody")}`)) return;
    setSaving(true);
    try {
      await api.updateTicket(selected.id, { status: nextStatus, comment });
      setSelected(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const countOf = (s: TicketStatus | "") => (s === "" ? allTickets.length : allTickets.filter((tk) => tk.status === s).length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ margin: 0 }}>{t("repairs")}</h1>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input className="input" style={{ width: 280 }} placeholder="Поиск по комнате или ID" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
        <button className="btn-secondary" onClick={load}>Найти</button>
        <div style={{ flex: 1 }} />
        <PillFilter
          value={status}
          onChange={setStatus}
          options={[
            { value: "", label: "Все", count: countOf("") },
            { value: "NEW", label: STATUS_LABEL.NEW, count: countOf("NEW") },
            { value: "IN_PROGRESS", label: STATUS_LABEL.IN_PROGRESS, count: countOf("IN_PROGRESS") },
            { value: "DONE", label: STATUS_LABEL.DONE, count: countOf("DONE") },
          ]}
        />
      </div>

      <Table
        rowKey={(tk) => tk.id}
        rows={tickets}
        onRowClick={openTicket}
        columns={[
          { key: "id", label: "ID", render: (tk) => <span className="mono">{tk.id.slice(-6).toUpperCase()}</span> },
          { key: "room", label: "Комната", render: (tk) => tk.room },
          { key: "category", label: "Проблема", render: (tk) => tk.category },
          { key: "resident", label: "Жилец", render: (tk) => tk.resident.fullName },
          { key: "date", label: "Дата", render: (tk) => new Date(tk.createdAt).toLocaleDateString("ru-RU") },
          { key: "status", label: "Статус", render: (tk) => <Badge label={STATUS_LABEL[tk.status]} tone={STATUS_TONE[tk.status]} /> },
        ]}
      />

      {selected && (
        <ModalCenter onClose={() => setSelected(null)}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{selected.category}</div>
          <div style={{ fontSize: 13, color: "var(--mu)" }}>
            <span className="mono">№{selected.id.slice(-6).toUpperCase()}</span> · {selected.resident.fullName} · комната {selected.room}
          </div>
          <div style={{ fontSize: 14 }}>{selected.description}</div>
          {selected.photos.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selected.photos.map((p) => (
                <img
                  key={p}
                  src={photoUrl(p)}
                  onClick={() => setViewingPhoto(photoUrl(p))}
                  style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", cursor: "pointer" }}
                />
              ))}
            </div>
          )}
          {selected.comment && (
            <div style={{ fontSize: 12, color: "var(--mu)" }}>
              Последний комментарий: <span style={{ fontStyle: "italic" }}>{selected.comment}</span>
            </div>
          )}
          <PillFilter
            value={nextStatus}
            onChange={setNextStatus}
            options={(["NEW", "IN_PROGRESS", "DONE"] as TicketStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
          />
          <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("adminComment")} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-secondary" onClick={() => setSelected(null)}>{t("cancel")}</button>
            <button className="btn-primary" style={{ width: 160 }} onClick={save} disabled={saving}>
              {saving ? "…" : t("save")}
            </button>
          </div>
        </ModalCenter>
      )}

      {viewingPhoto && (
        <div
          onClick={() => setViewingPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            cursor: "pointer",
          }}
        >
          <img src={viewingPhoto} style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}
