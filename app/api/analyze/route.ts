import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";
import type { Transaction } from "@/app/api/upload/route";
import { categorizeTransactions } from "@/lib/categorize";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface AnalysisResult {
  savings: string[];
  anomalies: {
    date: string;
    description: string;
    amount: number;
    reason: string;
  }[];
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { fileIds?: string[] };
  const { fileIds } = body;

  const files = await prisma.csvFile.findMany({
    where: {
      userId,
      ...(fileIds?.length ? { id: { in: fileIds } } : {}),
    },
  });

  let transactions: Transaction[] = [];
  for (const file of files) {
    try {
      const txs = JSON.parse(file.transactions) as Transaction[];
      transactions.push(...txs);
    } catch {
      // skip malformed
    }
  }

  transactions = categorizeTransactions(transactions);

  const totalExpenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);

  const byCategory: Record<string, number> = {};
  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const cat = t.category ?? "Other";
    byCategory[cat] = (byCategory[cat] ?? 0) + Math.abs(t.amount);
  }

  const categoryText = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
    .join(", ");

  const txSample = transactions
    .filter((t) => t.amount < 0)
    .sort((a, b) => a.amount - b.amount)
    .slice(0, 30)
    .map(
      (t) =>
        `${t.date} | ${t.description} | ${t.category ?? "Other"} | $${Math.abs(t.amount).toFixed(2)}`
    )
    .join("\n");

  const prompt = `You are a personal finance advisor. Analyze this user's spending data and respond in valid JSON only.

User's spending summary:
- Total income: $${totalIncome.toFixed(2)}
- Total expenses: $${totalExpenses.toFixed(2)}
- Spending by category: ${categoryText}

Top 30 largest expenses (date | description | category | amount):
${txSample}

Provide:
1. "savings": Exactly 4 specific, actionable saving tips referencing actual categories or merchants from the data.
2. "anomalies": Up to 5 transactions that look unusually large or suspicious vs the rest of the data.

Respond ONLY with this JSON format (no markdown, no explanation):
{
  "savings": ["tip1", "tip2", "tip3", "tip4"],
  "anomalies": [
    { "date": "...", "description": "...", "amount": 123.45, "reason": "..." }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const raw = response.text ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");
    const parsed = JSON.parse(jsonMatch[0]) as AnalysisResult;
    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Analyze error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
