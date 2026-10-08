import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Listing, PublicUser, ResidentRole, Ticket } from "@sfu/shared";
import { api } from "../api";
import { useLang } from "../LangContext";
import { SlideOverPanel } from "../components/ui";

const ROLES: ResidentRole[] = ["FLOOR_MONITOR", "INSPECTOR", "NEWS_EDITOR", "REGISTRAR"];

export default function ResidentsPage() {
  const { t } = useLang();
  const ROLE_LABEL: Record<ResidentRole, string> = {
    FLOOR_MONITOR: t("roleFloorMonitor"),
    INSPECTOR: t("roleInspector"),
    NEWS_EDITOR: t("roleNewsEditor"),
    REGISTRAR: t("roleRegistrar"),
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const [residents, setResidents] = useState<PublicUser[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<PublicUser | null>(null);
  const [selectedListings, setSelectedListings] = useState<Listing[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [adding, setAdding] = useState(false);
  const [newResident, setNewResident] = useState({ login: "", fullName: "", room: "", section: "", password: "sfu2026" });
  const [saving, setSaving] = useState(false);
  const [replacedNotice, setReplacedNotice] = useState(false);

  const load = () => api.adminResidents(q || undefined).then(setResidents);

  useEffect(() => {
    load();
  }, []);

  // Deep-link support: global search / notification bell can open a resident directly via ?id=.
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && residents.length > 0) {
      const r = residents.find((x) => x.id === id);
      if (r) openResident(r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [residents]);

  const openResident = (r: PublicUser) => {
    setSelected(r);
    api.listings({ residentId: r.id, status: "ACTIVE" }).then(setSelectedListings);
    api.tickets({ residentId: r.id }).then(setSelectedTickets);
  };

  const closeResident = () => {
    setSelected(null);
    if (searchParams.get("id")) setSearchParams({});
  };

  const patch = async (id: string, body: Partial<PublicUser>) => {
    const updated = await api.adminUpdateResident(id, body);
    setResidents((prev) => prev.map((r) => (r.id === id ? updated : r)));
    if (selected?.id === id) setSelected(updated);
  };

  const createResident = async () => {
    setSaving(true);
    try {
      const result = await api.adminCreateResident(newResident);
      setAdding(false);
      setReplacedNotice(!!result.replaced);
      setNewResident({ login: "", fullName: "", room: "", section: "", password: "sfu2026" });
      load();
      if (result.replaced) setTimeout(() => setReplacedNotice(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>{t("residents")}</h1>
        <button className="btn-primary" style={{ width: 180 }} onClick={() => setAdding(true)}>{t("addResident")}</button>
      </div>
      {replacedNotice && (
        <div style={{ color: "var(--accent)", fontSize: 13, fontWeight: 700 }}>{t("duplicateLoginReplaced")}</div>
      )}
      <input
        className="input"
        style={{ width: 320 }}
        placeholder="Поиск по имени, комнате, логину"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && load()}
      />
      <div style={{ fontSize: 12, color: "var(--mu)" }}>Найдено: {residents.length}</div>
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Договор</th>
              <th>Комната</th>
              <th>Заселение</th>
              <th>Выселение</th>
              <th>Статус проживания</th>
              <th>Роль</th>
              <th>Приложение</th>
              <th>Проверен</th>
            </tr>
          </thead>
          <tbody>
            {residents.slice(0, 10).map((r) => (
              <tr key={r.id} className="clickable" onClick={() => openResident(r)}>
                <td>{r.fullName}</td>
                <td className="mono">{r.login}</td>
                <td>{r.room}{r.section ? ` / ${r.section}` : ""}</td>
                <td>{new Date(r.createdAt).toLocaleDateString("ru-RU")}</td>
                <td>{r.checkoutDate ? new Date(r.checkoutDate).toLocaleDateString("ru-RU") : "—"}</td>
                <td>{r.checkoutDate && new Date(r.checkoutDate) < new Date() ? "Выселен(а)" : "Проживает"}</td>
                <td>{r.residentRole ? ROLE_LABEL[r.residentRole] : "—"}</td>
                <td>{r.loggedIntoApp ? new Date(r.lastLoginAt!).toLocaleDateString("ru-RU") : "⏳ не входил"}</td>
                <td>{r.verified ? "✅" : "⏳"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 12, color: "var(--mu)" }}>
        Показано {Math.min(10, residents.length)} из {residents.length}
      </div>

      {selected && (
        <SlideOverPanel onClose={closeResident}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{selected.fullName}</div>
            <button className="btn-secondary" onClick={closeResident}>Закрыть</button>
          </div>
          <div style={{ fontSize: 13, color: "var(--mu)" }} className="mono">{selected.login}</div>

          <div className="card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><div style={{ fontSize: 11, color: "var(--mu)" }}>Договор</div><div className="mono">{selected.login}</div></div>
            <div><div style={{ fontSize: 11, color: "var(--mu)" }}>Комната</div><div>{selected.room}</div></div>
            <div><div style={{ fontSize: 11, color: "var(--mu)" }}>Секция</div><div>{selected.section || "—"}</div></div>
            <div><div style={{ fontSize: 11, color: "var(--mu)" }}>Заселение</div><div>{new Date(selected.createdAt).toLocaleDateString("ru-RU")}</div></div>
            <div>
              <div style={{ fontSize: 11, color: "var(--mu)" }}>Последний вход</div>
              <div>{selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleString("ru-RU") : "не входил"}</div>
            </div>
            <div><div style={{ fontSize: 11, color: "var(--mu)" }}>Телефон</div><div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{selected.phone || "—"}</div></div>
            <div><div style={{ fontSize: 11, color: "var(--mu)" }}>Почта</div><div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{selected.email || "—"}</div></div>
            <div><div style={{ fontSize: 11, color: "var(--mu)" }}>MAX</div><div>{selected.maxId || "—"}</div></div>
            <div>
              <div style={{ fontSize: 11, color: "var(--mu)" }}>{t("emergencyContact")}</div>
              <div>
                {[selected.emergencyContactName, selected.emergencyContactRelation].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
            <div><div style={{ fontSize: 11, color: "var(--mu)" }}>Телефон экстр. контакта</div><div>{selected.emergencyContactPhone || "—"}</div></div>
            <div style={{ gridColumn: "1 / -1" }}><div style={{ fontSize: 11, color: "var(--mu)" }}>Мед. заметки</div><div>{selected.medicalNotes || "—"}</div></div>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontWeight: 700 }}>{t("verified")}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div className={`pill ${selected.verified ? "active" : ""}`} onClick={() => patch(selected.id, { verified: true })}>Да</div>
              <div className={`pill ${!selected.verified ? "active" : ""}`} onClick={() => patch(selected.id, { verified: false })}>Нет</div>
            </div>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontWeight: 700 }}>{t("role")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <div className={`pill ${!selected.residentRole ? "active" : ""}`} onClick={() => patch(selected.id, { residentRole: null })}>
                {t("roleNone")}
              </div>
              {ROLES.map((role) => (
                <div key={role} className={`pill ${selected.residentRole === role ? "active" : ""}`} onClick={() => patch(selected.id, { residentRole: role })}>
                  {ROLE_LABEL[role]}
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontWeight: 700, flex: 1 }}>{t("section")}</div>
            <input
              className="input"
              style={{ width: 100 }}
              defaultValue={selected.section || ""}
              onBlur={(e) => e.target.value !== (selected.section || "") && patch(selected.id, { section: e.target.value || null })}
            />
          </div>

          <div className="card" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontWeight: 700, flex: 1 }}>Дата выселения</div>
            <input
              className="input"
              type="date"
              style={{ width: 160 }}
              defaultValue={selected.checkoutDate ? selected.checkoutDate.slice(0, 10) : ""}
              onBlur={(e) => {
                const iso = e.target.value ? new Date(e.target.value).toISOString() : null;
                if (iso !== selected.checkoutDate) patch(selected.id, { checkoutDate: iso });
              }}
            />
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontWeight: 700 }}>{t("residentListings")}</div>
            {selectedListings.length === 0 && <div style={{ fontSize: 13, color: "var(--mu)" }}>{t("noMyListings")}</div>}
            {selectedListings.map((l) => (
              <div key={l.id} style={{ fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--bd)" }}>
                {l.title} · {l.price.toLocaleString("ru-RU")} ₽
              </div>
            ))}
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontWeight: 700 }}>{t("residentTickets")}</div>
            {selectedTickets.length === 0 && <div style={{ fontSize: 13, color: "var(--mu)" }}>{t("noNotifications")}</div>}
            {selectedTickets.map((tk) => (
              <div key={tk.id} style={{ fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--bd)" }}>
                {tk.category} · {tk.status}
              </div>
            ))}
          </div>
        </SlideOverPanel>
      )}

      {adding && (
        <div className="modal-center" onClick={() => setAdding(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{t("addResident")}</div>
            <input className="input" placeholder={t("fullName")} value={newResident.fullName} onChange={(e) => setNewResident((f) => ({ ...f, fullName: e.target.value }))} />
            <input className="input" placeholder={t("login")} value={newResident.login} onChange={(e) => setNewResident((f) => ({ ...f, login: e.target.value }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input className="input" placeholder={t("room")} value={newResident.room} onChange={(e) => setNewResident((f) => ({ ...f, room: e.target.value }))} />
              <input className="input" placeholder={t("section")} value={newResident.section} onChange={(e) => setNewResident((f) => ({ ...f, section: e.target.value }))} />
            </div>
            <input className="input" placeholder={t("password")} value={newResident.password} onChange={(e) => setNewResident((f) => ({ ...f, password: e.target.value }))} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setAdding(false)}>{t("cancel")}</button>
              <button className="btn-primary" style={{ width: 160 }} onClick={createResident} disabled={saving || !newResident.fullName || !newResident.login || !newResident.room}>
                {saving ? "…" : t("addResident")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
