import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActivityItem, AdminStats, PublicUser, Ticket, evictionInfo } from "@sfu/shared";
import { api } from "../api";
import { useLang } from "../LangContext";
import { Badge, KpiCard } from "../components/ui";

const FLOOR_OF = (room: string) => (/^\d{3,4}$/.test(room) ? String(Math.floor(Number(room) / 100)) : "?");

const ACTIVITY_ICON: Record<ActivityItem["type"], string> = {
  TICKET: "🛠️",
  APPEAL: "📝",
  CONTACT: "📮",
  REGISTRATION: "🆕",
  LOGIN: "🔓",
  MESSAGE: "💬",
};

const TICKET_STATUS_TONE: Record<Ticket["status"], "warning" | "accent" | "success"> = {
  NEW: "warning",
  IN_PROGRESS: "accent",
  DONE: "success",
};

export default function OverviewPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [residents, setResidents] = useState<PublicUser[]>([]);
  const [checkouts, setCheckouts] = useState<PublicUser[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [remindedIds, setRemindedIds] = useState<string[]>([]);

  const load = () => {
    api.adminStats().then(setStats);
    api.adminActivity().then(setActivity);
    api.adminResidents().then(setResidents);
    api.adminCheckouts().then(setCheckouts);
    api.tickets().then((all) => setRecentTickets(all.slice(0, 5)));
  };

  useEffect(() => {
    load();
  }, []);

  const openActivityItem = (item: ActivityItem) => {
    switch (item.type) {
      case "TICKET":
        return navigate(`/repairs?ticketId=${item.id}`);
      case "APPEAL":
        return navigate(`/appeals?appealId=${item.id}`);
      case "CONTACT":
        return navigate("/contact");
      case "REGISTRATION":
        return navigate(`/residents?id=${item.id}`);
      case "LOGIN":
        return navigate(`/residents?id=${item.id.replace(/^login-/, "").replace(/-\d+$/, "")}`);
      case "MESSAGE":
        return navigate("/chat");
    }
  };

  const floorCounts = residents.reduce<Record<string, number>>((acc, r) => {
    const floor = FLOOR_OF(r.room);
    acc[floor] = (acc[floor] || 0) + 1;
    return acc;
  }, {});
  const floors = Object.keys(floorCounts).sort((a, b) => Number(a) - Number(b));
  const totalResidents = residents.length || 1;

  const checkoutsSoon = checkouts.filter((r) => {
    const info = evictionInfo(r.checkoutDate);
    return info && info.tier !== "NEUTRAL";
  });

  const sendReminder = async (id: string) => {
    await api.sendCheckoutReminder(id);
    setRemindedIds((prev) => [...prev, id]);
  };

  const openPrefilledBroadcast = (r: PublicUser) => {
    navigate("/broadcasts", {
      state: {
        prefill: {
          audience: "room",
          target: r.room,
          title: "Скоро выселение",
          text: `${r.fullName}, напоминаем: дата вашего выселения приближается. Продлите договор в администрации (каб. 101) или запланируйте выезд.`,
        },
      },
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ margin: 0 }}>{t("overview")}</h1>
      <div className="kpi-row" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <KpiCard label={t("kpiStudents")} value={stats?.studentsCount ?? 0} caption="Всего проживающих" />
        <KpiCard label={t("kpiListings")} value={stats?.listingsCount ?? 0} caption="Активных объявлений" />
        <KpiCard label={t("kpiVerified")} value={stats?.verifiedCount ?? 0} caption="Договор подтверждён" />
        <KpiCard label={t("kpiNotLoggedIn")} value={stats?.notLoggedInCount ?? 0} caption="Ни разу не входили" />
        <KpiCard label={t("kpiTickets")} value={stats?.openTicketsCount ?? 0} caption="Требуют внимания" />
        <KpiCard label={t("kpiAppeals")} value={stats?.pendingAppealsCount ?? 0} caption="Ожидают ответа" />
        <KpiCard label={t("checkoutSoon")} value={checkoutsSoon.length} caption="В ближайшие 30 дней" accent={checkoutsSoon.length > 0} />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontWeight: 700, marginBottom: 14 }}>{t("occupancyByFloor")}</div>
          {floors.length === 0 && <div style={{ color: "var(--mu)", fontSize: 13 }}>Нет данных</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {floors.map((floor) => {
              const pct = Math.round((floorCounts[floor] / totalResidents) * 100);
              return (
                <div key={floor} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 56, fontSize: 12, color: "var(--mu)", fontWeight: 600 }}>Этаж {floor}</div>
                  <div style={{ flex: 1, height: 14, borderRadius: 999, background: "var(--sub)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, var(--accent), var(--accent-soft))",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <div style={{ width: 40, fontSize: 12, fontWeight: 700, textAlign: "right" }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="card"
          style={{
            flex: 1,
            minWidth: 280,
            background: checkoutsSoon.length > 0 ? "linear-gradient(135deg, var(--accent), var(--accent-soft))" : "var(--card)",
            color: checkoutsSoon.length > 0 ? "#fff" : "var(--tx)",
            boxShadow: checkoutsSoon.length > 0 ? "0 12px 28px rgba(255,107,0,.25)" : undefined,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{t("checkoutSoon")}</div>
          {checkoutsSoon.length === 0 && <div style={{ color: "var(--mu)", fontSize: 13 }}>Нет предстоящих выселений</div>}
          {checkoutsSoon.map((r) => {
            const info = evictionInfo(r.checkoutDate);
            const reminded = remindedIds.includes(r.id);
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderTop: `1px solid ${checkoutsSoon.length > 0 ? "rgba(255,255,255,.3)" : "var(--bd)"}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.fullName} · {r.room}</div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    {info && info.tier === "OVERDUE" ? t("checkoutOverdue") : `${info?.daysLeft} дн. до выселения`}
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  style={{ background: "#fff", borderColor: "#fff", color: "#FF6B00" }}
                  disabled={reminded}
                  onClick={() => openPrefilledBroadcast(r)}
                >
                  {reminded ? `✓ ${t("checkoutReminderSent")}` : t("sendReminder")}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Последние заявки на ремонт</div>
        {recentTickets.length === 0 && <div style={{ color: "var(--mu)", fontSize: 13 }}>Нет заявок</div>}
        {recentTickets.map((tk) => (
          <div
            key={tk.id}
            onClick={() => navigate(`/repairs?ticketId=${tk.id}`)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--bd)", cursor: "pointer" }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{tk.category} · {tk.resident.fullName}</div>
              <div style={{ fontSize: 12, color: "var(--mu)" }}>
                {t("room")} {tk.room} · {new Date(tk.createdAt).toLocaleDateString("ru-RU")}
              </div>
            </div>
            <Badge
              label={t(tk.status === "DONE" ? "ticketStatusDone" : tk.status === "IN_PROGRESS" ? "ticketStatusInProgress" : "ticketStatusNew")}
              tone={TICKET_STATUS_TONE[tk.status]}
            />
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 10 }}>{t("activityFeed")}</div>
        {activity.length === 0 && <div style={{ color: "var(--mu)", fontSize: 13 }}>Пока нет активности</div>}
        {activity.map((item) => (
          <div
            key={item.id}
            onClick={() => openActivityItem(item)}
            style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: "1px solid var(--bd)", cursor: "pointer" }}
          >
            <div style={{ fontSize: 16 }}>{ACTIVITY_ICON[item.type]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13 }}>{item.text}</div>
              <div style={{ fontSize: 11, color: "var(--mu)" }}>{new Date(item.createdAt).toLocaleString("ru-RU")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
