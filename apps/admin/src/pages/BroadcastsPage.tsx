import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChatMessage, DormEvent, PublicUser } from "@sfu/shared";
import { api, photoUrl } from "../api";
import { useLang } from "../LangContext";
import { PillFilter } from "../components/ui";

const DRAFT_KEY = "sfu_admin_broadcast_draft";
const SENT_LOG_KEY = "sfu_admin_broadcast_sent_log";
type SentLogEntry = { title: string; audienceLabel: string; recipientCount: number; date: string };

export default function BroadcastsPage() {
  const { t } = useLang();
  const location = useLocation();
  const prefill = (location.state as { prefill?: { audience: "all" | "floor" | "room"; target?: string; title: string; text: string } } | null)?.prefill;
  const [audience, setAudience] = useState<"all" | "floor" | "room">(prefill?.audience || "all");
  const [floor, setFloor] = useState(prefill?.audience === "floor" ? prefill.target || "1" : "1");
  const [room, setRoom] = useState(prefill?.audience === "room" ? prefill.target || "" : "");
  const [title, setTitle] = useState(prefill?.title || "");
  const [text, setText] = useState(prefill?.text || "");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [events, setEvents] = useState<DormEvent[]>([]);
  const [eventId, setEventId] = useState("");
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState<number | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [residents, setResidents] = useState<PublicUser[]>([]);
  const [draftSaved, setDraftSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [sentLog, setSentLog] = useState<SentLogEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(SENT_LOG_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const loadHistory = () => {
    api.chatChannels().then((channels) => {
      const ann = channels.find((c) => c.type === "ANNOUNCEMENTS");
      if (ann) api.chatMessages(ann.id).then((msgs) => setHistory(msgs.slice().reverse()));
    });
  };

  useEffect(() => {
    loadHistory();
    api.events().then(setEvents);
    api.adminResidents().then(setResidents);
    if (prefill) return; // a prefilled reminder takes precedence over a saved draft
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setTitle(draft.title || "");
        setText(draft.text || "");
        setAudience(draft.audience || "all");
        setFloor(draft.floor || "1");
        setRoom(draft.room || "");
      } catch {
        /* ignore malformed draft */
      }
    }
  }, []);

  const recipientCount = useMemo(() => {
    if (audience === "all") return residents.length;
    if (audience === "floor") return residents.filter((r) => r.room.startsWith(floor)).length;
    if (audience === "room") return residents.filter((r) => r.room === room).length;
    return 0;
  }, [audience, floor, room, residents]);

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, text, audience, floor, room }));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const form = new FormData();
      Array.from(files)
        .slice(0, 5 - photos.length)
        .forEach((f) => form.append("photos", f));
      const { urls } = await api.uploadPhotos(form);
      setPhotos((prev) => [...prev, ...urls].slice(0, 5));
    } finally {
      setUploading(false);
    }
  };

  const send = async () => {
    setSending(true);
    setReport(null);
    try {
      const audienceValue = audience === "all" ? "all" : audience === "floor" ? `floor:${floor}` : `room:${room}`;
      const audienceLabel =
        audience === "all"
          ? t("broadcastAudienceAll")
          : audience === "floor"
          ? `${t("broadcastAudienceFloor")} ${floor}`
          : `${t("broadcastAudienceRoom")} ${room}`;
      const res = await api.broadcast({ title, text, audience: audienceValue, photos, eventId: eventId || undefined });
      setReport(res.deliveredCount);
      const nextLog = [{ title, audienceLabel, recipientCount: res.deliveredCount, date: new Date().toISOString() }, ...sentLog].slice(0, 20);
      setSentLog(nextLog);
      localStorage.setItem(SENT_LOG_KEY, JSON.stringify(nextLog));
      setTitle("");
      setText("");
      setPhotos([]);
      setEventId("");
      localStorage.removeItem(DRAFT_KEY);
      loadHistory();
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ margin: 0 }}>{t("broadcasts")}</h1>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 320, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontWeight: 700 }}>{t("broadcasts")}</div>
          <PillFilter
            value={audience}
            onChange={setAudience}
            options={[
              { value: "all", label: t("broadcastAudienceAll") },
              { value: "floor", label: t("broadcastAudienceFloor") },
              { value: "room", label: t("broadcastAudienceRoom") },
            ]}
          />
          {audience === "floor" && (
            <select className="input" value={floor} onChange={(e) => setFloor(e.target.value)}>
              {["1", "2", "3", "4", "5", "6"].map((f) => (
                <option key={f} value={f}>
                  Этаж {f}
                </option>
              ))}
            </select>
          )}
          {audience === "room" && <input className="input" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Номер комнаты" />}
          <div style={{ fontSize: 12, color: "var(--mu)" }}>
            {t("recipientCount")}: <strong style={{ color: "var(--tx)" }}>{recipientCount}</strong>
          </div>

          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("broadcastTitle")} />
          <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("broadcastText")} />

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              onFiles(e.dataTransfer.files);
            }}
            style={{
              border: `1px dashed ${dragOver ? "var(--accent)" : "var(--bd)"}`,
              background: dragOver ? "var(--accent)11" : undefined,
              borderRadius: 14,
              padding: 14,
              textAlign: "center",
              fontSize: 13,
              color: "var(--mu)",
              cursor: "pointer",
            }}
          >
            {uploading ? "…" : `${t("attachPhoto")} (${photos.length}/5) — перетащите файлы сюда`}
            <input type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          </label>
          {photos.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {photos.map((p) => (
                <img key={p} src={photoUrl(p)} style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }} />
              ))}
            </div>
          )}

          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
            {t("attachEvent")}
            <input type="checkbox" className="switch" checked={!!eventId} onChange={(e) => setEventId(e.target.checked ? events[0]?.id || "" : "")} />
          </label>
          {eventId && (
            <select className="input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" onClick={saveDraft}>
              {draftSaved ? `✓ ${t("draftSaved")}` : t("saveDraft")}
            </button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={send} disabled={sending || !title || !text}>
              {sending ? "…" : t("broadcastSend")}
            </button>
          </div>
          {report !== null && (
            <div style={{ color: "var(--accent)", fontSize: 13, fontWeight: 700 }}>
              {t("deliveryReport")}: {report}
            </div>
          )}
        </div>

        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{t("previewTitle")}</div>
          <div className="card" style={{ background: "var(--sub)" }}>
            <span className="badge" style={{ background: "var(--accent)22", color: "var(--accent)" }}>
              {t("newsAnnouncement")}
            </span>
            <div style={{ fontWeight: 700, marginTop: 8 }}>{title || "—"}</div>
            <div style={{ fontSize: 13, marginTop: 4, whiteSpace: "pre-wrap" }}>{text || "—"}</div>
            {photos[0] && <img src={photoUrl(photos[0])} style={{ width: "100%", borderRadius: 12, marginTop: 8 }} />}
            {eventId && events.find((e) => e.id === eventId) && (
              <div style={{ marginTop: 8, padding: 10, borderRadius: 10, background: "var(--card)", border: "1px solid var(--bd)", display: "flex", gap: 8, alignItems: "center" }}>
                <span>🕐</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{events.find((e) => e.id === eventId)!.title}</div>
                  <div style={{ fontSize: 11, color: "var(--mu)" }}>
                    {new Date(events.find((e) => e.id === eventId)!.date).toLocaleString("ru-RU")}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 280, maxHeight: 560, overflowY: "auto" }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Отправленные</div>
          {sentLog.map((entry, i) => (
            <div key={i} style={{ padding: "10px 0", borderTop: "1px solid var(--bd)" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{entry.title}</div>
              <div style={{ fontSize: 11, color: "var(--mu)", marginTop: 2 }}>
                {entry.audienceLabel} · {t("recipientCount").toLowerCase()}: {entry.recipientCount} · {new Date(entry.date).toLocaleString("ru-RU")}
              </div>
            </div>
          ))}
          {sentLog.length === 0 && history.map((m) => (
            <div key={m.id} style={{ padding: "10px 0", borderTop: "1px solid var(--bd)" }}>
              <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{m.text}</div>
              <div style={{ fontSize: 11, color: "var(--mu)", marginTop: 4 }}>{new Date(m.createdAt).toLocaleString("ru-RU")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
