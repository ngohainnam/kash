"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Trash2,
  Loader2,
} from "lucide-react";
import TransactionTable from "@/components/TransactionTable";
import type { CsvFileRecord } from "@/app/api/files/route";
import type { Transaction } from "@/app/api/upload/route";

interface Props {
  file: CsvFileRecord;
  isOpen: boolean;
  isDeleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

function stat(txs: Transaction[]) {
  const income = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = txs.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  return { income, expenses, net: income + expenses };
}

function fmt(n: number) {
  return Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function StatementCard({ file, isOpen, isDeleting, onToggle, onDelete }: Props) {
  const [hoverDelete, setHoverDelete] = useState(false);
  const { income, expenses, net } = stat(file.transactions);
  const netPos = net >= 0;

  const date = new Date(file.uploadedAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--kash-border)",
        boxShadow: isOpen ? "0 8px 32px rgba(0,0,0,0.35)" : "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      {/* ── Card header ── */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* File icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent-glow)" }}
        >
          <FileSpreadsheet size={18} style={{ color: "var(--accent)" }} />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {file.fileName}
          </p>
          <div className="flex items-center gap-2.5 mt-0.5">
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <CalendarDays size={10} />
              {date}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-md"
              style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
            >
              {file.transactions.length} txns
            </span>
          </div>
        </div>

        {/* Summary pills — hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <div
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: "rgba(16,185,129,0.1)", color: "var(--green)" }}
          >
            {netPos ? "+" : "-"}
            {fmt(income)}
          </div>
          <div
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: "rgba(239,68,68,0.1)", color: "var(--red)" }}
          >
            {netPos ? "+" : "-"}
            {fmt(Math.abs(expenses))}
          </div>
          <div
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{
              background: netPos ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: netPos ? "var(--green)" : "var(--red)",
            }}
          >
            {netPos ? "+" : "-"}{fmt(Math.abs(net))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
            style={{
              color: isOpen ? "var(--accent)" : "var(--text-muted)",
              background: isOpen ? "var(--accent-glow)" : "transparent",
            }}
            title={isOpen ? "Collapse" : "Expand"}
          >
            {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            onMouseEnter={() => setHoverDelete(true)}
            onMouseLeave={() => setHoverDelete(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
            style={{
              color: hoverDelete ? "var(--red)" : "var(--text-muted)",
              background: hoverDelete ? "rgba(239,68,68,0.1)" : "transparent",
            }}
            title="Delete"
          >
            {isDeleting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile summary bar ── */}
      <div
        className="flex md:hidden items-center justify-around px-5 py-2 gap-3"
        style={{ borderTop: "1px solid var(--kash-border)" }}
      >
        <span className="text-xs font-semibold" style={{ color: "var(--green)" }}>
          +{fmt(income)}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>·</span>
        <span className="text-xs font-semibold" style={{ color: "var(--red)" }}>
          -{fmt(Math.abs(expenses))}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>·</span>
        <span className="text-xs font-semibold" style={{ color: netPos ? "var(--green)" : "var(--red)" }}>
          Net {netPos ? "+" : "-"}{fmt(Math.abs(net))}
        </span>
      </div>

      {/* ── Expanded transaction table ── */}
      {isOpen && (
        <div
          className="transition-all duration-300"
          style={{ borderTop: "1px solid var(--kash-border)" }}
        >
          <TransactionTable transactions={file.transactions} />
        </div>
      )}
    </div>
  );
}
