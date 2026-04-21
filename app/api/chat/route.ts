import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Transaction } from "@/app/api/upload/route";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

function buildSystemPrompt(transactions: Transaction[], fileNames: string[]): string {
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const net = totalIncome + totalExpenses;

  // Group by category for a spending summary
  const byCategory: Record<string, number> = {};
  for (const t of transactions) {
    const cat = t.category ?? "Uncategorized";
    byCategory[cat] = (byCategory[cat] ?? 0) + t.amount;
  }
  const categoryBreakdown = Object.entries(byCategory)
    .sort((a, b) => a[1] - b[1])
    .map(([cat, amt]) => `  - ${cat}: $${amt.toFixed(2)}`)
    .join("\n");

  // Top 10 largest expenses
  const topExpenses = [...transactions]
    .filter((t) => t.amount < 0)
    .sort((a, b) => a.amount - b.amount)
    .slice(0, 10)
    .map((t) => `  - ${t.date} | ${t.description} | $${t.amount.toFixed(2)}`)
    .join("\n");

  // Full transaction list (capped at 300 to stay within token limits)
  const txList = transactions
    .slice(0, 300)
    .map((t) => `${t.date} | ${t.description} | ${t.category ?? "—"} | $${t.amount.toFixed(2)}`)
    .join("\n");

  return `You are KASH, a smart and friendly personal finance AI assistant.
The user has uploaded their bank statement(s) and you have full access to their transaction data.
Your job is to answer questions about their finances clearly, accurately, and helpfully.

## Loaded statement files
${fileNames.join(", ")}

## Summary
- Total transactions: ${transactions.length}
- Total income:   $${totalIncome.toFixed(2)}
- Total expenses: $${Math.abs(totalExpenses).toFixed(2)}
- Net:            $${net.toFixed(2)} (${net >= 0 ? "surplus" : "deficit"})

## Spending by category
${categoryBreakdown || "  (no categories detected)"}

## Top 10 largest expenses
${topExpenses || "  (none)"}

## Full transaction list (date | description | category | amount)
${txList}
${transactions.length > 300 ? `\n(${transactions.length - 300} more transactions not shown — summarise from above data)` : ""}

## Instructions
- Always base your answers on the transaction data above.
- Just answer it in short sentences. The answer must not be too long.
- Be concise but thorough. Use bullet points or tables when it helps readability.
- If asked about a specific merchant, date range, or category, filter the data and give exact numbers.
- If the user asks something unrelated to their finances, politely redirect them.
- Format currency as $X,XXX.XX (AUD assumed unless told otherwise).
- Never make up transactions that are not in the data.`;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { messages: ChatMessage[]; fileIds?: string[] };
  const { messages, fileIds } = body;

  if (!messages?.length) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  // Load the user's selected files (or all files if none specified)
  const files = await prisma.csvFile.findMany({
    where: {
      userId,
      ...(fileIds?.length ? { id: { in: fileIds } } : {}),
    },
    orderBy: { uploadedAt: "desc" },
  });

  const transactions: Transaction[] = [];
  const fileNames: string[] = [];

  for (const file of files) {
    try {
      const txs = JSON.parse(file.transactions) as Transaction[];
      transactions.push(...txs);
      fileNames.push(file.fileName);
    } catch {
      // skip malformed
    }
  }

  const systemPrompt = buildSystemPrompt(transactions, fileNames);

  // Build Gemini conversation history (exclude the latest user message)
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  const latestMessage = messages[messages.length - 1].text;

  try {
    const contents = [
      ...history,
      { role: "user" as const, parts: [{ text: latestMessage }] },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { systemInstruction: systemPrompt },
      contents,
    });
    const text = response.text ?? "Sorry, I couldn't generate a response.";

    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Gemini error:", message);

    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { error: "Rate limit reached — please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: "AI request failed: " + message }, { status: 500 });
  }
}
