"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  name: string;
  value: number;
}

interface Props {
  data: DataPoint[];
}

// A palette that complements the dark navy KASH theme
const COLORS = [
  "#3b82f6", // blue  (accent)
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan  (accent-2)
  "#ef4444", // red
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#a855f7", // purple
  "#84cc16", // lime
  "#6366f1", // indigo
];

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--kash-border)",
        borderRadius: "12px",
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      }}
    >
      <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginBottom: 3 }}>{name}</p>
      <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.95rem" }}>{fmt(value)}</p>
    </div>
  );
}

function CustomLegend({ payload }: { payload?: { color: string; value: string }[] }) {
  if (!payload) return null;
  return (
    <ul
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 16px",
        justifyContent: "center",
        listStyle: "none",
        margin: "16px 0 0",
        padding: 0,
      }}
    >
      {payload.map((entry) => (
        <li key={entry.value} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SpendingPieChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="46%"
          innerRadius={68}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
