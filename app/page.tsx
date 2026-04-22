"use client";

import Link from "next/link";
import {
  TrendingUp,
  UploadCloud,
  ArrowRight,
  Activity,
  Zap,
  BarChart3,
  Sparkles,
  Target,
  PieChart,
  ShieldCheck,
  LayoutDashboard,
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
    icon: LayoutDashboard,
    title: "Financial Dashboard",
    desc: "See your total income, expenses, net balance, top spending categories, and AI-detected anomalies in one view.",
    color: "#10b981",
    glow: "rgba(16,185,129,0.12)",
    href: "/dashboard",
  },
  {
    icon: PieChart,
    title: "Spending Visualisations",
    desc: "Monthly bar charts and category pie charts give you a clear picture of where your money is going.",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.12)",
    href: "/visualize",
  },
  {
    icon: Target,
    title: "Budget Tracking",
    desc: "Set monthly limits per category. KASH shows real-time progress bars so you know when you're close to the edge.",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.12)",
    href: "/budget",
  },
  {
    icon: Zap,
    title: "AI Chat",
    desc: "Ask anything in plain English - 'What did I spend on food last month?' - and get a concise, accurate answer.",
    color: "#f97316",
    glow: "rgba(249,115,22,0.12)",
    href: "/chats",
  },
];

const DEMO_ROWS = [
  { date: "Apr 01", description: "Salary - April", category: "Income", amount: 5200 },
  { date: "Apr 03", description: "Woolworths Supermarket", category: "Food", amount: -134.5 },
  { date: "Apr 05", description: "Netflix Subscription", category: "Subscriptions", amount: -22.99 },
  { date: "Apr 07", description: "Uber Eats", category: "Food", amount: -38.7 },
  { date: "Apr 10", description: "Freelance Invoice #12", category: "Income", amount: 1200 },
  { date: "Apr 14", description: "Electricity Bill", category: "Bills", amount: -95 },
];

const WORKFLOW = [
  {
    step: "01",
    title: "Upload your CSV",
    desc: "Export your bank statement and drop it on the Files page. KASH parses it in seconds.",
    icon: UploadCloud,
    color: "#3b82f6",
    href: "/files",
  },
  {
    step: "02",
    title: "Explore your dashboard",
    desc: "Instantly see income, expenses, net balance, category breakdowns, and anomaly flags.",
    icon: Activity,
    color: "#10b981",
    href: "/dashboard",
  },
  {
    step: "03",
    title: "Set budgets & track spend",
    desc: "Create monthly limits per category and watch your progress bars in real time.",
    icon: Target,
    color: "#f59e0b",
    href: "/budget",
  },
  {
    step: "04",
    title: "Ask the AI anything",
    desc: "Chat with Gemini - it has full context of your transactions and answers in plain English.",
    icon: Sparkles,
    color: "#8b5cf6",
    href: "/chats",
  },
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
            Your finances,
            <br />
            <span className="kash-h1-accent">finally under control.</span>
          </h1>

          <p className="kash-sub">
            Upload a bank CSV and instantly get a full picture - spending charts,
            budget tracking, transaction notes, and an AI that answers any
            question about your money.
          </p>

          <div className="kash-cta-row">
            <Link href="/files" className="kash-btn-primary kash-link-btn">
              <UploadCloud size={16} />
              Upload Statement
            </Link>
            <Link href="/dashboard" className="kash-btn-outline kash-link-btn">
              <LayoutDashboard size={15} />
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature grid ─────────────────────────────── */}
      <section className="kash-section">
        <div className="kash-section-inner">
          <div className="kash-section-head">
            <h2 className="kash-h2">
              Everything you need,<br />nothing you don&apos;t.
            </h2>
            <p className="kash-section-sub">
              Six tightly integrated tools that turn a raw CSV into complete financial clarity.
            </p>
          </div>

          <div className="kash-features">
            {FEATURES.map(({ icon: Icon, title, desc, color, glow, href }) => (
              <Link key={title} href={href} className="kash-feature-card" style={{ textDecoration: "none" }}>
                <div className="kash-feature-icon" style={{ background: glow }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="kash-feature-title">{title}</h3>
                <p className="kash-feature-desc">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="kash-section kash-section-alt">
        <div className="kash-section-inner">
          <div className="kash-section-head">
            <Badge className="kash-section-badge">
              <ShieldCheck size={11} /> How it works
            </Badge>
            <h2 className="kash-h2">
              From CSV to clarity<br />in four steps.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
            {WORKFLOW.map(({ step, title, desc, icon: Icon, color, href }) => (
              <Link
                key={step}
                href={href}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="kash-feature-card"
                  style={{ height: "100%", gap: "1rem" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{
                      fontFamily: "monospace",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: color,
                      background: `${color}18`,
                      border: `1px solid ${color}30`,
                      borderRadius: "0.5rem",
                      padding: "0.2rem 0.5rem",
                      letterSpacing: "0.05em",
                    }}>
                      {step}
                    </span>
                    <div
                      className="kash-feature-icon"
                      style={{ background: `${color}18`, width: 34, height: 34, minWidth: 34 }}
                    >
                      <Icon size={16} style={{ color }} />
                    </div>
                  </div>
                  <h3 className="kash-feature-title">{title}</h3>
                  <p className="kash-feature-desc">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo table ───────────────────────────────── */}
      <section className="kash-section">
        <div className="kash-section-inner">
          <div className="kash-demo-layout">
            <div className="kash-demo-copy">
              <Badge className="kash-section-badge">
                <Activity size={11} /> Live Preview
              </Badge>
              <h2 className="kash-h2">
                Your transactions,<br />beautifully organised.
              </h2>
              <p className="kash-section-sub">
                Every row is auto-categorised, colour-coded, and ready for AI
                analysis - plus you can attach personal notes to any transaction.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/files" className="kash-btn-primary kash-link-btn kash-demo-btn">
                  <UploadCloud size={15} />
                  Upload & try
                </Link>
                <Link href="/visualize" className="kash-btn-outline kash-link-btn kash-demo-btn">
                  <PieChart size={15} />
                  See charts
                </Link>
              </div>
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
                              className={`kash-cat-badge ${isPos ? "kash-cat-income" : "kash-cat-default"}`}
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
      <section className="kash-section kash-section-alt">
        <div className="kash-section-inner">
          <div className="kash-cta-banner">
            <div className="kash-cta-blob" />
            <TrendingUp size={32} className="kash-cta-icon" />
            <h2 className="kash-cta-title">Ready to take control?</h2>
            <p className="kash-cta-sub">
              Upload your first statement in seconds and see your full financial picture instantly.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
              <Link href="/files" className="kash-btn-primary kash-link-btn">
                Get started
                <ArrowRight size={15} className="kash-btn-arrow" />
              </Link>
              <Link href="/chats" className="kash-btn-outline kash-link-btn">
                <Sparkles size={15} />
                Ask the AI
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
