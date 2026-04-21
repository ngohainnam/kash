"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  month: string;
  income: number;
  expense: number;
}

interface Props {
  data: DataPoint[];
}

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function fmtFull(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--kash-border)",
        borderRadius: "12px",
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        minWidth: 140,
      }}
    >
      <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginBottom: 8 }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
          <span style={{ fontSize: "0.78rem", color: entry.color, fontWeight: 600 }}>{entry.name}</span>
          <span style={{ fontSize: "0.78rem", color: "var(--text-primary)", fontWeight: 700 }}>{fmtFull(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload }: { payload?: { color: string; value: string }[] }) {
  if (!payload) return null;
  return (
    <ul
      style={{
        display: "flex",
        gap: "16px",
        justifyContent: "center",
        listStyle: "none",
        margin: "12px 0 0",
        padding: 0,
      }}
    >
      {payload.map((entry) => (
        <li key={entry.value} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: 3,
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

export default function MonthlyBarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} barGap={4} barCategoryGap="30%">
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--kash-border)"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--kash-border)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Legend content={<CustomLegend />} />
        <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
