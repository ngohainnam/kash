import type { Transaction } from "@/app/api/upload/route";

interface Props {
  transactions: Transaction[];
}

function fmt(value: number) {
  return `$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function Summary({ transactions }: Props) {
  if (transactions.length === 0) return null;

  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const net = income + expense;

  const cards = [
    { label: "Total Income", value: fmt(income), color: "var(--green)", dot: "#10b981" },
    { label: "Total Expenses", value: fmt(expense), color: "var(--red)", dot: "#ef4444" },
    {
      label: "Net Balance",
      value: `${net < 0 ? "-" : "+"}${fmt(net)}`,
      color: net >= 0 ? "var(--accent-2)" : "var(--red)",
      dot: net >= 0 ? "#06b6d4" : "#ef4444",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border px-5 py-4"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: card.dot }}
            />
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              {card.label}
            </p>
          </div>
          <p className="text-xl font-bold" style={{ color: card.color }}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
