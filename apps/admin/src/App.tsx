import React, { useEffect, useRef, useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import {
  FiBarChart2,
  FiBell,
  FiCalendar,
  FiCreditCard,
  FiFileText,
  FiMail,
  FiMenu,
  FiMessageCircle,
  FiSettings,
  FiTool,
  FiUsers,
  FiVolume2,
} from "react-icons/fi";
import { AdminStats, AppNotification, Listing, PublicUser, Ticket } from "@sfu/shared";
import { api } from "./api";
import { useAuth } from "./AuthContext";
import { useLang } from "./LangContext";
import { Icon } from "./components/ui";
import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";
import BroadcastsPage from "./pages/BroadcastsPage";
import EventsPage from "./pages/EventsPage";
import RepairsPage from "./pages/RepairsPage";
import AppealsPage from "./pages/AppealsPage";
import ResidentsPage from "./pages/ResidentsPage";
import ContactPage from "./pages/ContactPage";
import AccountingPage from "./pages/AccountingPage";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";

function NotificationBell() {
  const { t } = useLang();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = () => api.notifications().then(setNotifications);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="btn-secondary"
        style={{ width: 44, height: 44, borderRadius: 22, padding: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon icon={FiBell} size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              minWidth: 16,
              height: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="glass" style={{ position: "absolute", top: 52, right: 0, width: 320, maxHeight: 400, overflowY: "auto", zIndex: 50, padding: 12, borderRadius: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{t("notifications")}</div>
            <button className="btn-secondary" style={{ height: 32, fontSize: 11, padding: "0 12px" }} onClick={markAllRead}>
              {t("markAllRead")}
            </button>
          </div>
          {notifications.length === 0 && <div style={{ color: "var(--mu)", fontSize: 13 }}>{t("noNotifications")}</div>}
          {notifications.slice(0, 20).map((n) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              style={{ padding: "8px 0", borderTop: "1px solid var(--bd)", cursor: "pointer", opacity: n.read ? 0.6 : 1 }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</div>
              <div style={{ fontSize: 12, color: "var(--mu)" }}>{n.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GlobalSearch() {
  const { t } = useLang();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ residents: PublicUser[]; listings: Listing[]; tickets: Ticket[] } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setResults(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    const timeout = setTimeout(() => {
      api.adminSearch(q).then(setResults);
    }, 250);
    return () => clearTimeout(timeout);
  }, [q]);

  const hasResults = results && results.residents.length + results.listings.length + results.tickets.length > 0;

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, maxWidth: 420 }}>
      <input className="input" style={{ width: "100%" }} placeholder={t("globalSearchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
      {q.trim() && results && (
        <div className="glass" style={{ position: "absolute", top: 52, left: 0, right: 0, zIndex: 50, maxHeight: 420, overflowY: "auto", padding: 12, borderRadius: 20 }}>
          {!hasResults && <div style={{ color: "var(--mu)", fontSize: 13 }}>Ничего не найдено</div>}
          {results.residents.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "var(--mu)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{t("residents")}</div>
              {results.residents.map((r) => (
                <div
                  key={r.id}
                  className="clickable"
                  style={{ padding: "6px 0", fontSize: 13, cursor: "pointer" }}
                  onClick={() => {
                    setQ("");
                    navigate(`/residents?id=${r.id}`);
                  }}
                >
                  {r.fullName} · {t("room").toLowerCase()} {r.room}
                </div>
              ))}
            </div>
          )}
          {results.listings.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "var(--mu)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{t("kpiListings")}</div>
              {results.listings.map((l) => (
                <div key={l.id} style={{ padding: "6px 0", fontSize: 13 }}>
                  {l.title} · {l.price.toLocaleString("ru-RU")} ₽
                </div>
              ))}
            </div>
          )}
          {results.tickets.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "var(--mu)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{t("repairs")}</div>
              {results.tickets.map((tk) => (
                <div
                  key={tk.id}
                  className="clickable"
                  style={{ padding: "6px 0", fontSize: 13, cursor: "pointer" }}
                  onClick={() => {
                    setQ("");
                    navigate("/repairs");
                  }}
                >
                  {tk.category} · {tk.room}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { t } = useLang();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [unreadContact, setUnreadContact] = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState(0);

  useEffect(() => {
    api.adminStats().then(setStats);
    api.contactMessages().then((msgs) => setUnreadContact(msgs.filter((m) => !m.read).length));
    api.invoices().then((reqs) => setPendingInvoices(reqs.filter((r) => r.status === "REQUESTED").length));
  }, []);

  const NAV = [
    { to: "/", label: t("overview"), end: true, icon: FiBarChart2 },
    { to: "/broadcasts", label: t("broadcasts"), icon: FiVolume2 },
    { to: "/events", label: t("events"), icon: FiCalendar },
    { to: "/repairs", label: t("repairs"), icon: FiTool, count: stats?.openTicketsCount },
    { to: "/appeals", label: t("appeals"), icon: FiFileText, count: stats?.pendingAppealsCount },
    { to: "/residents", label: t("residents"), icon: FiUsers },
    { to: "/contact", label: t("contactMessagesTitle"), icon: FiMail, count: unreadContact },
    { to: "/accounting", label: t("departmentAccounting"), icon: FiCreditCard, count: pendingInvoices },
    { to: "/chat", label: t("chat"), icon: FiMessageCircle },
  ];

  const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderRadius: 12,
    color: isActive ? "#fff" : "var(--tx)",
    background: isActive ? "var(--accent)" : "transparent",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 14,
  });

  return (
    <div className="app-shell" style={{ display: "flex", height: "100vh" }}>
      <div className={`sidebar-backdrop${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />
      <aside
        className={`sidebar${sidebarOpen ? " open" : ""}`}
        style={{ width: 230, borderRight: "1px solid var(--bd)", padding: 16, display: "flex", flexDirection: "column", gap: 6, background: "var(--card)" }}
      >
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>СФУ · Общежитие №6</div>
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} style={linkStyle} onClick={() => setSidebarOpen(false)}>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon icon={item.icon} size={16} />
              {item.label}
            </span>
            {!!item.count && (
              <span style={{ background: "rgba(255,255,255,.25)", borderRadius: 999, fontSize: 11, padding: "1px 7px" }}>{item.count}</span>
            )}
          </NavLink>
        ))}
        <div style={{ flex: 1 }} />
        <NavLink to="/settings" style={linkStyle} onClick={() => setSidebarOpen(false)}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon icon={FiSettings} size={16} />
            {t("settings")}
          </span>
        </NavLink>
        <div style={{ fontSize: 12, color: "var(--mu)", padding: "0 14px" }}>{user?.fullName}</div>
      </aside>
      <main className="app-main" style={{ flex: 1, padding: 24, overflow: "auto", minWidth: 0 }}>
        <div className="app-topbar" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)} aria-label="Меню">
            <FiMenu size={18} />
          </button>
          <GlobalSearch />
          <div style={{ flex: 1 }} />
          <NotificationBell />
        </div>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/broadcasts" element={<BroadcastsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/repairs" element={<RepairsPage />} />
        <Route path="/appeals" element={<AppealsPage />} />
        <Route path="/residents" element={<ResidentsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/accounting" element={<AccountingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
