"use client";

import Link from "next/link";
import {
  TrendingUp,
  UploadCloud,
  ArrowRight,
  Activity,
  ShieldCheck,
  Zap,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FEATURES = [
  {
    icon: UploadCloud,
    title: "Smart Import",
    desc: "Drop any bank CSV and KASH parses it instantly - dates, amounts, and descriptions auto-detected.",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.12)",
  },
  {
    icon: Activity,
    title: "Live Analytics",
    desc: "Income, expenses, and net balance visualised in real time as soon as your file lands.",
    color: "#10b981",
    glow: "rgba(16,185,129,0.12)",
  },
  {
    icon: Zap,
    title: "AI Chat",
    desc: "Ask anything - 'What did I spend on food last month?' - and get a plain-English answer instantly.",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.12)",
  },
  {
    icon: ShieldCheck,
    title: "100 % Private",
    desc: "Everything stays in your browser. No accounts, no servers, no data leaving your device.",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.12)",
  },
];

const DEMO_ROWS = [
  { date: "Apr 01", description: "Salary - April", category: "Income", amount: 5200 },
  { date: "Apr 03", description: "Woolworths Supermarket", category: "Groceries", amount: -134.5 },
  { date: "Apr 05", description: "Netflix Subscription", category: "Entertainment", amount: -22.99 },
  { date: "Apr 07", description: "Uber Eats", category: "Dining", amount: -38.7 },
  { date: "Apr 10", description: "Freelance Invoice #12", category: "Income", amount: 1200 },
  { date: "Apr 14", description: "Electricity Bill", category: "Utilities", amount: -95 },
];

export default function Home() {

  return (
    <div className="kash-home">

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="kash-hero">
        <div className="kash-blob blob-1" />
        <div className="kash-blob blob-2" />

        <div className="kash-hero-inner">
          <div className="kash-pill">
            <Sparkles size={12} />
            <span>AI-Powered Finance Intelligence</span>
          </div>

          <h1 className="kash-h1">
            Introducing KASH
            <br />
            <span className="kash-h1-accent">Know exactly where every dollar goes.</span>
          </h1>

          <p className="kash-sub">
            KASH turns your bank CSV into instant insights. Upload once,
            understand everything - spending patterns, income trends, and
            AI-driven answers - all without leaving your browser.
          </p>

          <div className="kash-cta-row">
            <Link href="/files" className="kash-btn-primary kash-link-btn">
              <UploadCloud size={16} />
              Upload Statement
            </Link>
            <Link href="/chats" className="kash-btn-outline kash-link-btn">
              <Sparkles size={15} />
              Ask the AI
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature grid ─────────────────────────────── */}
      <section className="kash-section">
        <div className="kash-section-inner">
          <div className="kash-section-head">
            <h2 className="kash-h2">
              Everything you need,
              <br />nothing you don&apos;t.
            </h2>
            <p className="kash-section-sub">
              KASH is deliberately minimal - powerful analytics with zero friction.
            </p>
          </div>

          <div className="kash-features">
            {FEATURES.map(({ icon: Icon, title, desc, color, glow }) => (
              <div key={title} className="kash-feature-card">
                <div className="kash-feature-icon" style={{ background: glow }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="kash-feature-title">{title}</h3>
                <p className="kash-feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo table ───────────────────────────────── */}
      <section className="kash-section kash-section-alt">
        <div className="kash-section-inner">
          <div className="kash-demo-layout">
            <div className="kash-demo-copy">
              <Badge className="kash-section-badge">
                <Activity size={11} /> Live Preview
              </Badge>
              <h2 className="kash-h2">
                Your transactions,
                <br />beautifully organised.
              </h2>
              <p className="kash-section-sub">
                KASH auto-categorises every row, colour-codes income vs.
                expenses, and lets the AI answer follow-up questions instantly.
              </p>
              <Link href="/files" className="kash-btn-primary kash-link-btn kash-demo-btn">
                <UploadCloud size={15} />
                Try it now
              </Link>
            </div>

            <div className="kash-demo-table-wrap">
              <div className="kash-demo-table-glow" />
              <div className="kash-demo-table-card">
                <div className="kash-demo-table-header">
                  <span className="kash-demo-table-title">
                    <BarChart3 size={14} /> april_statement.csv
                  </span>
                  <Badge variant="secondary" className="kash-parsed-badge">
                    6 rows parsed
                  </Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="kash-table-header-row">
                      <TableHead className="kash-th">Date</TableHead>
                      <TableHead className="kash-th">Description</TableHead>
                      <TableHead className="kash-th">Category</TableHead>
                      <TableHead className="kash-th kash-th-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEMO_ROWS.map((row, i) => {
                      const isPos = row.amount > 0;
                      const fmt = `${isPos ? "+" : "-"}$${Math.abs(row.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
                      return (
                        <TableRow key={i} className="kash-table-row">
                          <TableCell className="kash-td-muted">{row.date}</TableCell>
                          <TableCell className="kash-td-primary">{row.description}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`kash-cat-badge ${row.category === "Income" ? "kash-cat-income" : "kash-cat-default"}`}
                            >
                              {row.category}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="kash-td-amount"
                            style={{ color: isPos ? "var(--green)" : "var(--red)" }}
                          >
                            {fmt}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────── */}
      <section className="kash-section">
        <div className="kash-section-inner">
          <div className="kash-cta-banner">
            <div className="kash-cta-blob" />
            <TrendingUp size={32} className="kash-cta-icon" />
            <h2 className="kash-cta-title">Ready to take control?</h2>
            <p className="kash-cta-sub">
              Upload your first statement in seconds. Sign-up required.
            </p>
            <Link href="/files" className="kash-btn-primary kash-link-btn">
              Get started
              <ArrowRight size={15} className="kash-btn-arrow" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
