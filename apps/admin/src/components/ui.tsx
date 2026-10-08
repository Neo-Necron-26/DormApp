import React from "react";
import type { IconType } from "react-icons";

export function Icon({ icon: IconComp, size = 16, style }: { icon: IconType; size?: number; style?: React.CSSProperties }) {
  const El = IconComp as unknown as React.FC<{ size?: number; style?: React.CSSProperties }>;
  return <El size={size} style={style} />;
}

export function KpiCard({ label, value, caption, accent }: { label: string; value: number; caption?: string; accent?: boolean }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 140 }}>
      <div style={{ color: "var(--mu)", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6, color: accent ? "var(--accent)" : "var(--tx)" }}>{value}</div>
      {caption && <div style={{ color: "var(--mu)", fontSize: 11, marginTop: 4 }}>{caption}</div>}
    </div>
  );
}

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  const colors: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: "var(--sub)", fg: "var(--mu)" },
    accent: { bg: "var(--accent)22", fg: "var(--accent)" },
    success: { bg: "#1a9e5c22", fg: "#1a9e5c" },
    warning: { bg: "#F59E0B22", fg: "#B45309" },
    danger: { bg: "#DC262622", fg: "#DC2626" },
  };
  const c = colors[tone];
  return (
    <span className="badge" style={{ background: c.bg, color: c.fg }}>
      {label}
    </span>
  );
}

export function PillFilter<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((opt) => (
        <div key={opt.value} className={`pill ${value === opt.value ? "active" : ""}`} onClick={() => onChange(opt.value)}>
          {opt.label}
          {opt.count !== undefined && (
            <span
              style={{
                marginLeft: 6,
                background: value === opt.value ? "rgba(255,255,255,.3)" : "var(--bd)",
                borderRadius: 999,
                fontSize: 10,
                padding: "1px 6px",
              }}
            >
              {opt.count}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function Table<T>({ columns, rows, onRowClick, rowKey }: {
  columns: { key: string; label: string; render: (row: T) => React.ReactNode }[];
  rows: T[];
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: "auto" }}>
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={onRowClick ? "clickable" : undefined} onClick={() => onRowClick?.(row)}>
              {columns.map((c) => (
                <td key={c.key}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ModalCenter({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-center" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function SlideOverPanel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
