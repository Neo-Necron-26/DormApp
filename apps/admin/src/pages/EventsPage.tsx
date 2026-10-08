import React, { useEffect, useState } from "react";
import { DormEvent } from "@sfu/shared";
import { api, photoUrl } from "../api";
import { useLang } from "../LangContext";

export default function EventsPage() {
  const { t } = useLang();
  const [events, setEvents] = useState<DormEvent[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [delivered, setDelivered] = useState<number | null>(null);

  const load = () => api.events({ includePast: true }).then(setEvents);

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.date).getTime() >= now);
  const past = events.filter((e) => new Date(e.date).getTime() < now);

  useEffect(() => {
    load();
  }, []);

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

  const create = async () => {
    setCreating(true);
    setDelivered(null);
    try {
      const res = await api.createEvent({ title, description, date: new Date(date).toISOString(), photos });
      setTitle("");
      setDescription("");
      setDate("");
      setPhotos([]);
      setDelivered(res.deliveredCount);
      load();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ margin: 0 }}>{t("events")}</h1>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 320, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontWeight: 700 }}>{t("eventCreate")}</div>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("eventTitle")} />
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" />
          <input className="input" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          <label style={{ border: "1px dashed var(--bd)", borderRadius: 14, padding: 14, textAlign: "center", fontSize: 13, color: "var(--mu)", cursor: "pointer" }}>
            {uploading ? "…" : `${t("attachPhoto")} (${photos.length}/5)`}
            <input type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          </label>
          {photos.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {photos.map((p) => (
                <img key={p} src={photoUrl(p)} style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }} />
              ))}
            </div>
          )}
          <button className="btn-primary" onClick={create} disabled={creating || !title || !description || !date}>
            {creating ? "…" : "Создать (с автоматической рассылкой)"}
          </button>
          {delivered !== null && (
            <div style={{ color: "var(--accent)", fontSize: 13, fontWeight: 700 }}>
              {t("deliveryReport")}: {delivered}
            </div>
          )}
        </div>
        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>
            Предстоящие ({upcoming.length}) · {past.length} прошедших скрыто
          </div>
          {upcoming.length === 0 && <div style={{ color: "var(--mu)", fontSize: 13 }}>Пока нет мероприятий</div>}
          {upcoming.map((e) => (
            <div key={e.id} style={{ padding: "10px 0", borderTop: "1px solid var(--bd)" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{e.title}</div>
              <div style={{ fontSize: 12, color: "var(--mu)" }}>{new Date(e.date).toLocaleString("ru-RU")}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{e.description}</div>
              {e.photos[0] && <img src={photoUrl(e.photos[0])} style={{ width: "100%", borderRadius: 10, marginTop: 8 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
