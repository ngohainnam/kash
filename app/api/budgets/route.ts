import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export interface BudgetRecord {
  id: string;
  category: string;
  monthlyLimit: number;
  month: string;
}

// GET /api/budgets — all budgets for the signed-in user
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const budgets = await prisma.budget.findMany({ where: { userId } });
  return NextResponse.json({ budgets });
}

// POST /api/budgets — upsert a budget entry
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category, monthlyLimit, month } = (await req.json()) as {
    category: string;
    monthlyLimit: number;
    month: string;
  };

  if (!category || monthlyLimit == null || !month) {
    return NextResponse.json({ error: "category, monthlyLimit, month required" }, { status: 400 });
  }

  const budget = await prisma.budget.upsert({
    where: { userId_category_month: { userId, category, month } },
    create: { userId, category, monthlyLimit, month },
    update: { monthlyLimit },
  });

  return NextResponse.json({ budget });
}
