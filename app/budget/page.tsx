"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Target,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import type { CsvFileRecord } from "@/app/api/files/route";
import type { Transaction } from "@/app/api/upload/route";
import type { BudgetRecord } from "@/app/api/budgets/route";
import { categorizeTransactions } from "@/lib/categorize";
import type { Category } from "@/lib/categorize";

const ALL_CATEGORIES: Category[] = [
  "Food",
  "Transport",
  "Bills",
  "Entertainment",
  "Shopping",
  "Health",
  "Education",
  "Travel",
  "Subscriptions",
  "Transfers",
  "Other",
];

function fmt(n: number) {
  return `$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function fmtMonthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleString("default", { month: "long", year: "numeric" });
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [files, setFiles] = useState<CsvFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonthKey());
  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState<Category>("Food");
  const [formLimit, setFormLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, fRes] = await Promise.all([
        fetch("/api/budgets"),
        fetch("/api/files"),
      ]);
      const [bJson, fJson] = await Promise.all([bRes.json(), fRes.json()]);
      setBudgets(bJson.budgets ?? []);
      setFiles(fJson.files ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Compute spending for current selected month
  const allTxs: Transaction[] = files.flatMap((f) =>
    categorizeTransactions(f.transactions)
  );

  const spentByCategory: Record<string, number> = {};
  for (const t of allTxs) {
    if (t.amount >= 0) continue;
    // Match transaction date to selected month
    const d = new Date(t.date);
    const txMonth = isNaN(d.getTime())
      ? t.date.slice(0, 7)
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (txMonth !== month) continue;
    const cat = t.category ?? "Other";
    spentByCategory[cat] = (spentByCategory[cat] ?? 0) + Math.abs(t.amount);
  }

  // Budgets for selected month (or "default")
  const activeBudgets = budgets.filter(
    (b) => b.month === month || b.month === "default"
  );

  async function saveBudget() {
    const limit = parseFloat(formLimit);
    if (!formCategory || isNaN(limit) || limit <= 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: formCategory, monthlyLimit: limit, month }),
      });
      const json = await res.json() as { budget: BudgetRecord };
      setBudgets((prev) => {
        const filtered = prev.filter(
          (b) => !(b.category === formCategory && b.month === month)
        );
        return [...filtered, json.budget];
      });
      setShowForm(false);
      setFormLimit("");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBudget(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  // Generate month options: current month ± 6 months
  const monthOptions: string[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    monthOptions.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }

  const usedCategories = new Set(
    activeBudgets.map((b) => b.category)
  );
  const availableCategories = ALL_CATEGORIES.filter(
    (c) => !usedCategories.has(c)
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-glow)" }}>
              <Target size={18} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Budget Tracker</h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Set monthly limits and track your spending</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Plus size={15} />
            Add Budget
          </button>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-3 mb-8">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Month</label>
          <div className="relative">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="viz-select"
              style={{ width: "auto", minWidth: "160px" }}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>{fmtMonthLabel(m)}</option>
              ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          </div>
        </div>

        {/* Add budget form */}
        {showForm && (
          <div className="rounded-2xl border p-5 mb-6" style={{ background: "var(--bg-surface)", borderColor: "var(--accent)", boxShadow: "0 0 0 1px rgba(59,130,246,0.2)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>New Budget — {fmtMonthLabel(month)}</h3>
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Category</label>
                <div className="relative">
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Category)}
                    className="viz-select"
                    style={{ width: "160px" }}
                  >
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    {availableCategories.length === 0 && (
                      <option disabled>All categories set</option>
                    )}
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Monthly Limit ($)</label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  placeholder="500"
                  value={formLimit}
                  onChange={(e) => setFormLimit(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void saveBudget()}
                  className="rounded-xl text-sm px-3 py-2 outline-none focus:ring-1"
                  style={{
                    background: "var(--bg-base)",
                    border: "1px solid var(--kash-border)",
                    color: "var(--text-primary)",
                    width: "140px",
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void saveBudget()}
                  disabled={saving || availableCategories.length === 0}
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                  style={{ background: "var(--accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Save
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-sm px-3 py-2 rounded-xl"
                  style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        )}

        {!loading && activeBudgets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ border: "1px dashed var(--kash-border)", background: "var(--bg-surface)" }}>
            <Target size={32} style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }} />
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No budgets set for {fmtMonthLabel(month)}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Click &quot;Add Budget&quot; to set a spending limit</p>
          </div>
        )}

        {!loading && activeBudgets.length > 0 && (
          <div className="space-y-4">
            {activeBudgets.map((b) => {
              const spent = spentByCategory[b.category] ?? 0;
              const pct = Math.min(100, (spent / b.monthlyLimit) * 100);
              const over = spent > b.monthlyLimit;
              const near = !over && pct >= 80;
              const barColor = over ? "var(--red)" : near ? "#f59e0b" : "var(--green)";
              const remaining = b.monthlyLimit - spent;

              return (
                <div
                  key={b.id}
                  className="rounded-2xl border p-5"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: over ? "rgba(239,68,68,0.3)" : near ? "rgba(245,158,11,0.25)" : "var(--kash-border)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {over ? (
                        <AlertTriangle size={14} style={{ color: "var(--red)" }} />
                      ) : near ? (
                        <AlertTriangle size={14} style={{ color: "#f59e0b" }} />
                      ) : (
                        <TrendingUp size={14} style={{ color: "var(--green)" }} />
                      )}
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{b.category}</span>
                      {over && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(239,68,68,0.12)", color: "var(--red)" }}>Over budget</span>
                      )}
                      {near && !over && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>Near limit</span>
                      )}
                    </div>
                    <button
                      onClick={() => void deleteBudget(b.id)}
                      disabled={deletingId === b.id}
                      className="p-1.5 rounded-lg transition-all hover:opacity-70"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {deletingId === b.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ background: "var(--bg-hover)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <span style={{ color: "var(--text-muted)" }}>
                        Spent: <strong style={{ color: "var(--text-primary)" }}>{fmt(spent)}</strong>
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        Budget: <strong style={{ color: "var(--text-primary)" }}>{fmt(b.monthlyLimit)}</strong>
                      </span>
                    </div>
                    <span style={{ color: over ? "var(--red)" : "var(--green)" }} className="font-semibold">
                      {over ? `${fmt(Math.abs(remaining))} over` : `${fmt(remaining)} left`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Unbudgeted spending */}
        {!loading && files.length > 0 && (
          <div className="mt-8 rounded-2xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--kash-border)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Unbudgeted Spending — {fmtMonthLabel(month)}
            </h3>
            <div className="space-y-2">
              {Object.entries(spentByCategory)
                .filter(([cat]) => !usedCategories.has(cat))
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amt]) => (
                  <div key={cat} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--kash-border)" }}>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{cat}</span>
                    <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--red)" }}>{fmt(amt)}</span>
                  </div>
                ))}
              {Object.entries(spentByCategory).filter(([cat]) => !usedCategories.has(cat)).length === 0 && (
                <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
                  All spending categories are budgeted for this month 🎉
                </p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
