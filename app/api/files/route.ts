import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Transaction } from "@/app/api/upload/route";

export interface CsvFileRecord {
  id: string;
  fileName: string;
  uploadedAt: string;
  transactions: Transaction[];
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const files = await prisma.csvFile.findMany({
    where: { userId },
    orderBy: { uploadedAt: "desc" },
  });

  const result: CsvFileRecord[] = files.map((f) => ({
    id: f.id,
    fileName: f.fileName,
    uploadedAt: f.uploadedAt.toISOString(),
    transactions: JSON.parse(f.transactions) as Transaction[],
  }));

  return NextResponse.json({ files: result });
}
