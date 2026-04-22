"use client";

import { useCallback, useEffect, useState } from "react";
import { FileSpreadsheet, BarChart2, Loader2, ChevronDown, Download } from "lucide-react";
import type { CsvFileRecord } from "@/app/api/files/route";
import type { Transaction } from "@/app/api/upload/route";
import { categorizeTransactions } from "@/lib/categorize";
import SpendingPieChart from "@/components/charts/SpendingPieChart";
import MonthlyBarChart from "@/components/charts/MonthlyBarChart";

// ── helpers ──────────────────────────────────────────

function buildCategoryData(transactions: Transaction[]) {
  const tagged = categorizeTransactions(transactions);
  const map: Record<string, number> = {};
  for (const t of tagged) {
    if (t.amount >= 0) continue; // expenses only
    const cat = t.category ?? "Other";
    map[cat] = (map[cat] ?? 0) + Math.abs(t.amount);
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);
}

function buildMonthlyData(transactions: Transaction[]) {
  const map: Record<string, { income: number; expense: number }> = {};
  for (const t of transactions) {
    // Try to parse month from date (handles YYYY-MM-DD, MM/DD/YYYY, etc.)
    const d = new Date(t.date);
    const key = isNaN(d.getTime())
      ? t.date.slice(0, 7)
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map[key]) map[key] = { income: 0, expense: 0 };
    if (t.amount >= 0) map[key].income += t.amount;
    else map[key].expense += Math.abs(t.amount);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income, expense }]) => ({
      month: formatMonth(month),
      income: parseFloat(income.toFixed(2)),
      expense: parseFloat(expense.toFixed(2)),
    }));
}

function formatMonth(key: string): string {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return isNaN(date.getTime())
    ? key
    : date.toLocaleString("default", { month: "short", year: "2-digit" });
}

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── component ─────────────────────────────────────────

export default function VisualizePage() {
  const [files, setFiles] = useState<CsvFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/files");
      const json = await res.json();
      const list: CsvFileRecord[] = res.ok ? json.files : [];
      setFiles(list);
      if (list.length > 0) setSelectedId(list[0].id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const selected = files.find((f) => f.id === selectedId) ?? null;
  const txs: Transaction[] = selected?.transactions ?? [];
  const categoryData = buildCategoryData(txs);
  const monthlyData = buildMonthlyData(txs);

  const totalIncome = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = totalIncome - totalExpense;

  async function exportPDF() {
    if (!selected) return;
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text("KASH Financial Report", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Statement: ${selected.fileName}`, 14, 28);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`, 14, 34);

      // Summary table
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("Summary", 14, 46);
      autoTable(doc, {
        startY: 50,
        head: [["Metric", "Amount"]],
        body: [
          ["Total Income", `$${totalIncome.toFixed(2)}`],
          ["Total Expenses", `$${totalExpense.toFixed(2)}`],
          ["Net Balance", `${net >= 0 ? "+" : "-"}$${Math.abs(net).toFixed(2)}`],
          ["Transactions", String(txs.length)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      });

      // Category breakdown
      const lastY1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 90;
      doc.text("Spending by Category", 14, lastY1 + 12);
      autoTable(doc, {
        startY: lastY1 + 16,
        head: [["Category", "Amount", "% of Expenses"]],
        body: categoryData.map((row) => [
          row.name,
          `$${row.value.toFixed(2)}`,
          totalExpense > 0 ? `${((row.value / totalExpense) * 100).toFixed(1)}%` : "0%",
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      });

      // Monthly data
      const lastY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 150;
      if (lastY2 + 30 > 270) doc.addPage();
      const monthStartY = lastY2 + 30 > 270 ? 20 : lastY2 + 12;
      doc.text("Monthly Income vs Expenses", 14, monthStartY);
      autoTable(doc, {
        startY: monthStartY + 4,
        head: [["Month", "Income", "Expenses", "Net"]],
        body: monthlyData.map((row) => [
          row.month,
          `$${row.income.toFixed(2)}`,
          `$${row.expense.toFixed(2)}`,
          `${row.income - row.expense >= 0 ? "+" : "-"}$${Math.abs(row.income - row.expense).toFixed(2)}`,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      });

      // Transactions (first 100)
      doc.addPage();
      doc.setFontSize(12);
      doc.text("Transaction List (first 100)", 14, 20);
      autoTable(doc, {
        startY: 24,
        head: [["Date", "Description", "Category", "Amount"]],
        body: txs.slice(0, 100).map((t) => [
          t.date,
          t.description.slice(0, 45),
          t.category ?? "—",
          `${t.amount >= 0 ? "+" : "-"}$${Math.abs(t.amount).toFixed(2)}`,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      });

      doc.save(`kash-report-${selected.fileName.replace(/\.csv$/i, "")}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* ── Page header ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--accent-glow)" }}
              >
                <BarChart2 size={18} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                  Visualize
                </h1>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Charts and breakdowns from your uploaded statements
                </p>
              </div>
            </div>
            {selected && (
              <button
                onClick={() => void exportPDF()}
                disabled={pdfLoading}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all flex-shrink-0"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--kash-border)", color: "var(--text-primary)", opacity: pdfLoading ? 0.7 : 1 }}
              >
                {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {pdfLoading ? "Generating…" : "Download PDF"}
              </button>
            )}
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-24 gap-3" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading statements…</span>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && files.length === 0 && (
          <div
            className="rounded-2xl border flex flex-col items-center justify-center gap-4 py-20 text-center"
            style={{ background: "var(--bg-surface)", borderColor: "var(--kash-border)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--accent-glow)" }}
            >
              <FileSpreadsheet size={24} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No statements yet</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Upload a CSV from the{" "}
                <a href="/files" style={{ color: "var(--accent)" }} className="underline underline-offset-2">
                  Files
                </a>{" "}
                page to see your charts here.
              </p>
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        {!loading && files.length > 0 && (
          <>
            {/* File selector */}
            <div className="mb-8">
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                Statement
              </label>
              <div className="relative w-full max-w-sm">
                <select
                  value={selectedId ?? ""}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="viz-select"
                >
                  {files.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.fileName}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                />
              </div>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total Income", value: fmt(totalIncome), color: "var(--green)" },
                { label: "Total Expenses", value: fmt(totalExpense), color: "var(--red)" },
                { label: "Net Balance", value: (net >= 0 ? "+" : "-") + fmt(Math.abs(net)), color: net >= 0 ? "var(--accent-2)" : "var(--red)" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-2xl border px-5 py-4"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--kash-border)" }}
                >
                  <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
                  <p className="text-xl font-bold" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

              {/* Pie chart */}
              <div
                className="rounded-2xl border p-6"
                style={{ background: "var(--bg-surface)", borderColor: "var(--kash-border)" }}
              >
                <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  Spending by Category
                </h2>
                <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
                  Where your money went — expense categories only
                </p>
                {categoryData.length === 0 ? (
                  <p className="text-sm text-center py-12" style={{ color: "var(--text-muted)" }}>No expense data</p>
                ) : (
                  <SpendingPieChart data={categoryData} />
                )}
              </div>

              {/* Bar chart */}
              <div
                className="rounded-2xl border p-6"
                style={{ background: "var(--bg-surface)", borderColor: "var(--kash-border)" }}
              >
                <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  Monthly Income vs Expenses
                </h2>
                <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
                  Side-by-side comparison per month
                </p>
                {monthlyData.length === 0 ? (
                  <p className="text-sm text-center py-12" style={{ color: "var(--text-muted)" }}>No monthly data</p>
                ) : (
                  <MonthlyBarChart data={monthlyData} />
                )}
              </div>
            </div>

            {/* Category breakdown table */}
            {categoryData.length > 0 && (
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ background: "var(--bg-surface)", borderColor: "var(--kash-border)" }}
              >
                <div className="px-6 py-4 border-b" style={{ borderColor: "var(--kash-border)" }}>
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Category Breakdown
                  </h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid var(--kash-border)`, background: "var(--bg-hover)" }}>
                      <th className="kash-th text-left">Category</th>
                      <th className="kash-th text-right">Amount</th>
                      <th className="kash-th text-right">Share</th>
                      <th className="kash-th pr-6">Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData.map((row, i) => {
                      const pct = totalExpense > 0 ? (row.value / totalExpense) * 100 : 0;
                      return (
                        <tr
                          key={row.name}
                          className="kash-table-row"
                          style={{ borderBottom: i < categoryData.length - 1 ? `1px solid var(--kash-border)` : "none" }}
                        >
                          <td className="kash-td-primary px-6 py-3 font-medium">{row.name}</td>
                          <td className="kash-td-amount px-6 py-3" style={{ color: "var(--red)" }}>
                            {fmt(row.value)}
                          </td>
                          <td className="kash-td-muted px-6 py-3 text-right tabular-nums">
                            {pct.toFixed(1)}%
                          </td>
                          <td className="px-6 py-3 pr-6">
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  background: `var(--accent)`,
                                  opacity: 0.7 + (i / categoryData.length) * 0.3,
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
