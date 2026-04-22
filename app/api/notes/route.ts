import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/notes?fileId=xxx
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fileId = req.nextUrl.searchParams.get("fileId");
  if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });

  const notes = await prisma.transactionNote.findMany({
    where: { userId, fileId },
    orderBy: { txIndex: "asc" },
  });

  return NextResponse.json({ notes });
}

// POST /api/notes — create or update a note (empty note = delete)
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileId, txIndex, note } = (await req.json()) as {
    fileId: string;
    txIndex: number;
    note: string;
  };

  if (!fileId || txIndex === undefined) {
    return NextResponse.json({ error: "fileId and txIndex required" }, { status: 400 });
  }

  if (!note.trim()) {
    await prisma.transactionNote.deleteMany({ where: { userId, fileId, txIndex } });
    return NextResponse.json({ deleted: true });
  }

  const result = await prisma.transactionNote.upsert({
    where: { userId_fileId_txIndex: { userId, fileId, txIndex } },
    create: { userId, fileId, txIndex, note: note.trim() },
    update: { note: note.trim() },
  });

  return NextResponse.json({ note: result });
}
