import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";

export default function LoginPage() {
  const { user, login, error } = useAuth();
  const { lang, setLang } = useLang();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await login(loginValue.trim(), password);
    setSubmitting(false);
  };

  return (
    <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <form onSubmit={onSubmit} className="card" style={{ width: "min(360px, 100%)", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{ fontSize: 12, fontWeight: 700, color: "var(--mu)", cursor: "pointer" }}
            onClick={(e) => {
              e.preventDefault();
              setLang(lang === "ru" ? "en" : "ru");
            }}
          >
            {lang.toUpperCase()}
          </div>
        </div>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Вход через аккаунт СФУ</h1>
          <p style={{ color: "var(--mu)", fontSize: 13 }}>
            Единый логин и пароль университета (api.sfu-kras.ru). Роль подтягивается из системы.
          </p>
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--mu)" }}>
          Логин СФУ
          <input className="input" value={loginValue} onChange={(e) => setLoginValue(e.target.value)} placeholder="Dorm6-Admin" />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--mu)" }}>
          Пароль
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error === "access_denied" && <p style={{ color: "#E5484D", fontSize: 13 }}>⛔ Нет доступа — этот аккаунт не администратор</p>}
        {error === "invalid_credentials" && <p style={{ color: "#E5484D", fontSize: 13 }}>Неверный логин или пароль</p>}
        <button className="btn-primary" type="submit" disabled={submitting || !loginValue || !password}>
          {submitting ? "…" : "Войти"}
        </button>
        <p style={{ color: "var(--mu)", fontSize: 12, textAlign: "center" }}>Демо: Dorm6-Admin / sfu2026</p>
      </form>
    </div>
  );
}
