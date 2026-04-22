"use client";

import { useEffect, useRef, useState } from "react";
import type { Transaction } from "@/app/api/upload/route";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StickyNote, Check, X } from "lucide-react";

interface NoteRecord {
  id: string;
  note: string;
}

interface Props {
  transactions: Transaction[];
  fileId?: string; // if provided, notes feature is enabled
}

export default function TransactionTable({ transactions, fileId }: Props) {
  const [notes, setNotes] = useState<Record<number, NoteRecord>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!fileId) return;
    fetch(`/api/notes?fileId=${fileId}`)
      .then((r) => r.json())
      .then((j) => {
        const map: Record<number, NoteRecord> = {};
        for (const n of (j.notes ?? []) as { id: string; txIndex: number; note: string }[]) {
          map[n.txIndex] = { id: n.id, note: n.note };
        }
        setNotes(map);
      })
      .catch(() => {});
  }, [fileId]);

  useEffect(() => {
    if (editingIndex !== null) setTimeout(() => inputRef.current?.focus(), 0);
  }, [editingIndex]);

  function startEdit(i: number) {
    setEditingIndex(i);
    setDraftNote(notes[i]?.note ?? "");
  }

  function cancelEdit() {
    setEditingIndex(null);
    setDraftNote("");
  }

  async function saveNote(txIndex: number) {
    if (!fileId) return;
    setSavingIndex(txIndex);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, txIndex, note: draftNote }),
      });
      const json = await res.json() as { note?: NoteRecord; deleted?: boolean };
      if (json.deleted) {
        setNotes((prev) => { const next = { ...prev }; delete next[txIndex]; return next; });
      } else if (json.note) {
        setNotes((prev) => ({ ...prev, [txIndex]: json.note! }));
      }
    } finally {
      setSavingIndex(null);
      setEditingIndex(null);
      setDraftNote("");
    }
  }

  if (transactions.length === 0) return null;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--kash-border)" }}>
      <Table>
        <TableHeader>
          <TableRow className="kash-table-header-row">
            <TableHead className="kash-th">Date</TableHead>
            <TableHead className="kash-th">Description</TableHead>
            <TableHead className="kash-th">Category</TableHead>
            <TableHead className="kash-th kash-th-right">Amount</TableHead>
            {fileId && <TableHead className="kash-th" style={{ width: "2.5rem" }} />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx, i) => {
            const isPos = tx.amount > 0;
            const fmtAmt = `${isPos ? "+" : "-"}$${Math.abs(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const hasNote = !!notes[i];
            const isEditing = editingIndex === i;

            return (
              <>
                <TableRow key={`tx-${i}`} className="kash-table-row">
                  <TableCell className="kash-td-muted">{tx.date}</TableCell>
                  <TableCell className="kash-td-primary">{tx.description}</TableCell>
                  <TableCell>
                    {tx.category && (
                      <Badge variant="outline" className={`kash-cat-badge ${isPos ? "kash-cat-income" : "kash-cat-default"}`}>
                        {tx.category}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="kash-td-amount" style={{ color: isPos ? "var(--green)" : "var(--red)" }}>
                    {fmtAmt}
                  </TableCell>
                  {fileId && (
                    <TableCell className="px-2 py-2 text-center">
                      <button
                        onClick={() => isEditing ? cancelEdit() : startEdit(i)}
                        title={hasNote ? "Edit note" : "Add note"}
                        className="rounded-lg p-1.5 transition-all hover:opacity-80"
                        style={{ color: hasNote ? "var(--accent)" : "var(--text-muted)", background: hasNote ? "var(--accent-glow)" : "transparent" }}
                      >
                        <StickyNote size={13} />
                      </button>
                    </TableCell>
                  )}
                </TableRow>

                {fileId && (isEditing || hasNote) && (
                  <TableRow key={`note-${i}`} style={{ background: "var(--bg-card)" }}>
                    <TableCell colSpan={5} className="px-4 py-2">
                      {isEditing ? (
                        <div className="flex items-start gap-2">
                          <textarea
                            ref={inputRef}
                            value={draftNote}
                            onChange={(e) => setDraftNote(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void saveNote(i); }
                              if (e.key === "Escape") cancelEdit();
                            }}
                            placeholder="Add a note… (Enter to save, Esc to cancel)"
                            rows={2}
                            className="flex-1 rounded-lg text-xs px-3 py-2 resize-none outline-none"
                            style={{ background: "var(--bg-base)", border: "1px solid var(--accent)", color: "var(--text-primary)" }}
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => void saveNote(i)}
                              disabled={savingIndex === i}
                              className="p-1.5 rounded-lg"
                              style={{ background: "var(--accent)", color: "#fff" }}
                            >
                              <Check size={12} />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 rounded-lg" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p
                          className="text-xs cursor-pointer hover:opacity-70 transition-opacity"
                          style={{ color: "var(--text-secondary)", fontStyle: "italic" }}
                          onClick={() => startEdit(i)}
                        >
                          📝 {notes[i].note}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
