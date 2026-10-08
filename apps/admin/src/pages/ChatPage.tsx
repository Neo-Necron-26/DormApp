import React, { useEffect, useRef, useState } from "react";
import { ChatChannelSummary, ChatMessage } from "@sfu/shared";
import { api } from "../api";
import { useSocket } from "../SocketContext";
import { useLang } from "../LangContext";

export default function ChatPage() {
  const { t } = useLang();
  const LABEL: Record<string, string> = {
    SECTION: t("chatSection"),
    DORM: t("chatDorm"),
    ANNOUNCEMENTS: t("chatAnnouncements"),
    CAMPUS: t("chatCampus"),
  };
  const socket = useSocket();
  const [channels, setChannels] = useState<ChatChannelSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.chatChannels().then((cs) => {
      setChannels(cs);
      if (cs.length) setActiveId(cs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!activeId) return;
    api.chatMessages(activeId).then(setMessages);
  }, [activeId]);

  useEffect(() => {
    if (!socket || !activeId) return;
    socket.emit("join-channel", activeId);
    const onMessage = (m: ChatMessage) => {
      if (m.channelId === activeId) setMessages((prev) => [...prev, m]);
    };
    socket.on("chat-message", onMessage);
    return () => {
      socket.emit("leave-channel", activeId);
      socket.off("chat-message", onMessage);
    };
  }, [socket, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const active = channels.find((c) => c.id === activeId);

  const send = async () => {
    if (!text.trim() || !activeId) return;
    const body = text;
    setText("");
    const message = await api.sendChatMessage(activeId, { text: body });
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <h1 style={{ margin: 0 }}>{t("chat")}</h1>
      <div style={{ display: "flex", gap: 8 }}>
        {channels.map((c) => (
          <div key={c.id} className={`pill ${activeId === c.id ? "active" : ""}`} onClick={() => setActiveId(c.id)}>
            {LABEL[c.type]}
          </div>
        ))}
      </div>
      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.map((m) => (
            <div key={m.id} style={{ maxWidth: "70%" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: m.author.role === "ADMIN" ? "var(--accent)" : "var(--mu)" }}>{m.author.fullName}</div>
              <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{m.text}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--bd)" }}>
          {active?.canPost ? (
            <>
              <input
                className="input"
                style={{ flex: 1 }}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={t("chatMessagePlaceholder")}
              />
              <button className="btn-primary" style={{ width: 100 }} onClick={send}>{t("chatSend")}</button>
            </>
          ) : (
            <div style={{ color: "var(--mu)", fontSize: 13 }}>{t("chatReadOnly")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
