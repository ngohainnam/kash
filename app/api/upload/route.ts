import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
}

const REQUIRED_HEADERS = ["Date", "Description", "Amount"];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const fileName = (file as File).name;
  const text = await (file as File).text();

  const { data, meta, errors } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  // Validate headers
  const missing = REQUIRED_HEADERS.filter(
    (h) => !meta.fields?.includes(h)
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required columns: ${missing.join(", ")}` },
      { status: 422 }
    );
  }

  if (errors.length > 0) {
    console.warn("CSV parse warnings:", errors);
  }

  const transactions: Transaction[] = [];

  for (const row of data) {
    const date = row["Date"]?.trim();
    const description = row["Description"]?.trim();
    const rawAmount = row["Amount"]?.trim();

    if (!date || !description || rawAmount === undefined || rawAmount === "") {
      continue;
    }

    const amount = parseFloat(rawAmount.replace(/[^0-9.\-]/g, ""));
    if (isNaN(amount)) continue;

    transactions.push({ date, description, amount });
  }

  // Persist to database
  const saved = await prisma.csvFile.create({
    data: {
      userId,
      fileName,
      transactions: JSON.stringify(transactions),
    },
  });

  return NextResponse.json({ transactions, fileId: saved.id });
}

