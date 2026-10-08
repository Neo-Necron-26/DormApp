import React, { useEffect, useState } from "react";
import { PublicUser, ResidentRole } from "@sfu/shared";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import { PillFilter } from "../components/ui";

const NOTIF_PREFS_KEY = "sfu_admin_notif_prefs";
type NotifPrefs = { newTicket: boolean; newMessage: boolean; logins: boolean; dailySummary: boolean };
const DEFAULT_PREFS: NotifPrefs = { newTicket: true, newMessage: true, logins: false, dailySummary: false };

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLang();
  const { themeName, setThemeName } = useTheme();
  const [staff, setStaff] = useState<PublicUser[]>([]);
  const [roleHolders, setRoleHolders] = useState<PublicUser[]>([]);
  const [prefs, setPrefs] = useState<NotifPrefs>(() => {
    try {
      return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY) || "{}") };
    } catch {
      return DEFAULT_PREFS;
    }
  });

  const ROLE_LABEL: Record<ResidentRole, string> = {
    FLOOR_MONITOR: t("roleFloorMonitor"),
    INSPECTOR: t("roleInspector"),
    NEWS_EDITOR: t("roleNewsEditor"),
    REGISTRAR: t("roleRegistrar"),
  };

  useEffect(() => {
    api.adminStaff().then(setStaff);
    api.adminResidents().then((all) => setRoleHolders(all.filter((r) => r.residentRole)));
  }, []);

  const setPref = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
      <h1 style={{ margin: 0 }}>{t("settings")}</h1>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>{t("language")}</div>
        <PillFilter value={lang} onChange={setLang} options={[{ value: "ru", label: "RU" }, { value: "en", label: "EN" }]} />
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>{t("theme")}</div>
        <PillFilter value={themeName} onChange={setThemeName} options={[{ value: "light", label: t("light") }, { value: "dark", label: t("dark") }]} />
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontWeight: 700 }}>{t("adminNotifPrefs")}</div>
        {(
          [
            ["newTicket", t("notifNewTicket")],
            ["newMessage", t("notifNewMessage")],
            ["logins", t("notifLogins")],
            ["dailySummary", t("notifDailySummary")],
          ] as [keyof NotifPrefs, string][]
        ).map(([key, label]) => (
          <label key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
            {label}
            <input type="checkbox" className="switch" checked={prefs[key]} onChange={(e) => setPref(key, e.target.checked)} />
          </label>
        ))}
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>{t("adminAccount")}</div>
        <div style={{ fontSize: 14 }}>{user?.fullName}</div>
        <div style={{ fontSize: 13, color: "var(--mu)" }}>{user?.email || "—"} · {user?.phone || "—"}</div>
        <div style={{ fontSize: 13, color: "var(--mu)", fontFamily: "monospace" }}>{user?.login}</div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>{t("dormStaff")}</div>
        {staff.map((s) => (
          <div key={s.id} style={{ fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--bd)" }}>
            {s.fullName} {s.maxId && <span style={{ color: "var(--mu)" }}>· {s.maxId}</span>}
          </div>
        ))}
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>{t("roleHolders")}</div>
        {roleHolders.length === 0 && <div style={{ fontSize: 13, color: "var(--mu)" }}>{t("noRoleHolders")}</div>}
        {roleHolders.map((r) => (
          <div key={r.id} style={{ fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--bd)" }}>
            {r.fullName} · {r.residentRole && ROLE_LABEL[r.residentRole]}
          </div>
        ))}
      </div>

      <button className="btn-secondary" style={{ alignSelf: "flex-start" }} onClick={logout}>{t("logout")}</button>
    </div>
  );
}
