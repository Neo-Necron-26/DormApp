import React, { useEffect, useState } from "react";
import { ContactMessage } from "@sfu/shared";
import { api, photoUrl } from "../api";
import { useLang } from "../LangContext";
import { Badge } from "../components/ui";

export default function ContactPage() {
  const { t } = useLang();
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  const load = () => api.contactMessages().then(setMessages);

  useEffect(() => {
    load();
  }, []);

  const toggleRead = async (m: ContactMessage) => {
    await api.markContactMessageRead(m.id, !m.read);
    load();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ margin: 0 }}>{t("contactMessagesTitle")}</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && <div className="card" style={{ color: "var(--mu)", fontSize: 13 }}>{t("noNotifications")}</div>}
        {messages.map((m) => (
          <div key={m.id} className="card" style={{ display: "flex", gap: 12 }}>
            {m.photo && <img src={photoUrl(m.photo)} style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover" }} />}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700 }}>
                  {m.resident.fullName} · {t("room").toLowerCase()} {m.resident.room}
                </div>
                <Badge label={t(m.read ? "markRead" : "markUnread")} tone={m.read ? "neutral" : "accent"} />
              </div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{m.text}</div>
              <div style={{ fontSize: 11, color: "var(--mu)", marginTop: 4 }}>{new Date(m.createdAt).toLocaleString("ru-RU")}</div>
              <button className="btn-secondary" style={{ marginTop: 8, height: 32, fontSize: 12 }} onClick={() => toggleRead(m)}>
                {t(m.read ? "markUnread" : "markRead")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
