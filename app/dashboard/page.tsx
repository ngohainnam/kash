"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileSpreadsheet,
  AlertTriangle,
  Sparkles,
  Loader2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import type { CsvFileRecord } from "@/app/api/files/route";
import type { Transaction } from "@/app/api/upload/route";
import type { AnalysisResult } from "@/app/api/analyze/route";
import { categorizeTransactions } from "@/lib/categorize";

// ── helpers ──────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function detectAnomalies(txs: Transaction[]) {
  const byCategory: Record<string, number[]> = {};
  for (const t of txs) {
    if (t.amount >= 0) continue;
    const cat = t.category ?? "Other";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(Math.abs(t.amount));
  }

  const flagged: (Transaction & { reason: string })[] = [];

  for (const t of txs) {
    if (t.amount >= 0) continue;
    const cat = t.category ?? "Other";
    const amounts = byCategory[cat];
    if (!amounts || amounts.length < 3) continue;

    const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const absAmt = Math.abs(t.amount);

    // Flag if 3× the mean and at least $30 above mean
    if (absAmt > mean * 3 && absAmt > mean + 30) {
      flagged.push({
        ...t,
        reason: `${fmt(absAmt)} vs avg ${fmt(mean)} in ${cat}`,
      });
    }
  }

  // Sort by amount desc, deduplicate
  return flagged
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 5);
}

function buildCategoryTotals(txs: Transaction[]) {
  const map: Record<string, number> = {};
  for (const t of txs) {
    if (t.amount >= 0) continue;
    const cat = t.category ?? "Other";
    map[cat] = (map[cat] ?? 0) + Math.abs(t.amount);
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
}

// ── component ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const [files, setFiles] = useState<CsvFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState<AnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/files");
      const json = await res.json();
      setFiles(res.ok ? json.files : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFiles();
  }, [fetchFiles]);

  // Aggregate across all files
  const allTxs: Transaction[] = files.flatMap((f) =>
    categorizeTransactions(f.transactions)
  );

  const totalIncome = allTxs
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = allTxs
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = totalIncome - totalExpenses;
  const savingsRate =
    totalIncome > 0 ? ((net / totalIncome) * 100).toFixed(1) : "0.0";

  const categoryTotals = buildCategoryTotals(allTxs);
  const maxCategory = categoryTotals[0]?.[1] ?? 1;

  const recentTxs = [...allTxs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  const localAnomalies = detectAnomalies(allTxs);

  async function runAiAnalysis() {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const json = await res.json() as AnalysisResult & { error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Analysis failed");
      setAiResult(json);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Failed to analyze");
    } finally {
      setAiLoading(false);
    }
  }

  const summaryCards = [
    { label: "Total Income", value: fmt(totalIncome), color: "var(--green)", icon: TrendingUp, bg: "rgba(16,185,129,0.1)" },
    { label: "Total Expenses", value: fmt(totalExpenses), color: "var(--red)", icon: TrendingDown, bg: "rgba(239,68,68,0.1)" },
    { label: "Net Balance", value: (net >= 0 ? "+" : "-") + fmt(Math.abs(net)), color: net >= 0 ? "var(--accent-2)" : "var(--red)", icon: DollarSign, bg: net >= 0 ? "rgba(6,182,212,0.1)" : "rgba(239,68,68,0.1)" },
    { label: "Files Uploaded", value: String(files.length), color: "var(--accent)", icon: FileSpreadsheet, bg: "var(--accent-glow)" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-glow)" }}>
            <LayoutDashboard size={18} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Your financial overview across all statements</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24 gap-3" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading statements…</span>
          </div>
        )}

        {!loading && files.length === 0 && (
          <div className="rounded-2xl border flex flex-col items-center justify-center gap-4 py-20 text-center" style={{ background: "var(--bg-surface)", borderColor: "var(--kash-border)" }}>
            <FileSpreadsheet size={36} style={{ color: "var(--text-muted)" }} />
            <div>
              <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No statements yet</p>
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Upload a CSV to see your dashboard</p>
              <Link href="/files" className="kash-link-btn kash-btn-primary text-sm px-4 py-2 rounded-xl">
                Upload statements <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {!loading && files.length > 0 && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {summaryCards.map(({ label, value, color, icon: Icon, bg }) => (
                <div key={label} className="rounded-2xl border px-5 py-4" style={{ background: "var(--bg-surface)", borderColor: "var(--kash-border)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "var(--text-muted)" }}>{label}</p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Savings rate banner */}
            <div className="rounded-2xl border px-6 py-4 mb-8 flex items-center justify-between" style={{ background: "var(--bg-surface)", borderColor: "var(--kash-border)" }}>
              <div>
                <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Savings Rate</p>
                <p className="text-3xl font-bold" style={{ color: Number(savingsRate) >= 20 ? "var(--green)" : Number(savingsRate) >= 0 ? "var(--accent-2)" : "var(--red)" }}>
                  {savingsRate}%
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {Number(savingsRate) >= 20 ? "Great saving habit! Keep it up." : Number(savingsRate) >= 0 ? "Room to improve - aim for 20%+" : "Expenses exceed income this period."}
                </p>
              </div>
              <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(0, Number(savingsRate)))}%`,
                    background: Number(savingsRate) >= 20 ? "var(--green)" : Number(savingsRate) >= 0 ? "var(--accent-2)" : "var(--red)",
                  }}
                />
              </div>
            </div>

            {/* Mid row: categories + recent txs */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

              {/* Top categories */}
              <div className="rounded-2xl border p-6" style={{ background: "var(--bg-surface)", borderColor: "var(--kash-border)" }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Top Spending Categories</h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Expenses only, all statements</p>
                  </div>
                  <Link href="/visualize" className="text-xs flex items-center gap-1 hover:underline" style={{ color: "var(--accent)" }}>
                    Full breakdown <ArrowRight size={11} />
                  </Link>
                </div>
                <div className="space-y-3">
                  {categoryTotals.map(([cat, amt]) => {
                    const pct = (amt / maxCategory) * 100;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{cat}</span>
                          <span className="text-xs tabular-nums font-semibold" style={{ color: "var(--red)" }}>{fmt(amt)}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)", opacity: 0.75 }} />
                        </div>
                      </div>
                    );
                  })}
                  {categoryTotals.length === 0 && (
                    <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>No expense data</p>
                  )}
                </div>
              </div>

              {/* Recent transactions */}
              <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--kash-border)" }}>
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--kash-border)" }}>
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent Transactions</h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Last 10 across all statements</p>
                  </div>
                  <Link href="/files" className="text-xs flex items-center gap-1 hover:underline" style={{ color: "var(--accent)" }}>
                    All files <ArrowRight size={11} />
                  </Link>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--kash-border)" }}>
                  {recentTxs.length === 0 && (
                    <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>No transactions</p>
                  )}
                  {recentTxs.map((t, i) => {
                    const isPos = t.amount > 0;
                    return (
                      <div key={i} className="flex items-center justify-between px-5 py-3 hover:transition-colors" style={{ borderColor: "var(--kash-border)" }}>
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm truncate font-medium" style={{ color: "var(--text-primary)" }}>{t.description}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t.date}{t.category ? ` · ${t.category}` : ""}</p>
                        </div>
                        <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: isPos ? "var(--green)" : "var(--red)" }}>
                          {isPos ? "+" : "-"}{fmt(Math.abs(t.amount))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Anomaly detection (rule-based) */}
            {localAnomalies.length > 0 && (
              <div className="rounded-2xl border p-6 mb-8" style={{ background: "var(--bg-surface)", borderColor: "rgba(245,158,11,0.3)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={16} style={{ color: "#f59e0b" }} />
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Unusual Transactions Detected</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
                    {localAnomalies.length} flagged
                  </span>
                </div>
                <div className="space-y-2">
                  {localAnomalies.map((t, i) => (
                    <div key={i} className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{t.description}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#f59e0b", opacity: 0.8 }}>{t.date} · {t.reason}</p>
                      </div>
                      <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: "var(--red)" }}>
                        -{fmt(Math.abs(t.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis section */}
            <div className="rounded-2xl border p-6" style={{ background: "var(--bg-surface)", borderColor: "var(--kash-border)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} style={{ color: "var(--accent)" }} />
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>AI Financial Analysis</h2>
                </div>
                {!aiResult && (
                  <button
                    onClick={() => void runAiAnalysis()}
                    disabled={aiLoading}
                    className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                    style={{ background: "var(--accent)", color: "#fff", opacity: aiLoading ? 0.7 : 1, cursor: aiLoading ? "not-allowed" : "pointer" }}
                  >
                    {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    {aiLoading ? "Analyzing…" : "Analyze with AI"}
                  </button>
                )}
                {aiResult && (
                  <button
                    onClick={() => { setAiResult(null); void runAiAnalysis(); }}
                    disabled={aiLoading}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: "var(--bg-hover)", color: "var(--text-secondary)", cursor: "pointer" }}
                  >
                    Refresh
                  </button>
                )}
              </div>
              <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
                Get personalised savings tips and AI-detected anomalies based on your actual transaction data.
              </p>

              {aiError && (
                <p className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {aiError}
                </p>
              )}

              {!aiResult && !aiLoading && !aiError && (
                <div className="flex items-center justify-center py-10 rounded-xl" style={{ border: "1px dashed var(--kash-border)" }}>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Click &quot;Analyze with AI&quot; to get personalised insights</p>
                </div>
              )}

              {aiLoading && (
                <div className="flex items-center justify-center py-10 gap-3" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">AI is analysing your transactions…</span>
                </div>
              )}

              {aiResult && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Savings tips */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>💡 Savings Suggestions</p>
                    <div className="space-y-2">
                      {(aiResult.savings ?? []).map((tip, i) => (
                        <div key={i} className="flex items-start gap-2.5 px-4 py-3 rounded-xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                          <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--green)" }} />
                          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI anomalies */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>⚠️ AI-Detected Anomalies</p>
                    {(aiResult.anomalies ?? []).length === 0 ? (
                      <p className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", color: "var(--green)" }}>
                        No anomalies detected - your spending looks consistent!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(aiResult.anomalies ?? []).map((a, i) => (
                          <div key={i} className="px-4 py-3 rounded-xl" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-sm font-medium truncate mr-2" style={{ color: "var(--text-primary)" }}>{a.description}</p>
                              <span className="text-sm font-bold flex-shrink-0" style={{ color: "var(--red)" }}>-{fmt(a.amount)}</span>
                            </div>
                            <p className="text-xs" style={{ color: "#f59e0b", opacity: 0.8 }}>{a.date} · {a.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
