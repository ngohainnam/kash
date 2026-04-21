"use client";

import { useCallback, useEffect, useState } from "react";
import UploadBox from "@/components/UploadBox";
import StatementCard from "@/components/StatementCard";
import type { Transaction } from "@/app/api/upload/route";
import type { CsvFileRecord } from "@/app/api/files/route";
import { FileSpreadsheet, FolderOpen, Loader2 } from "lucide-react";

async function loadFiles(): Promise<CsvFileRecord[]> {
  const res = await fetch("/api/files");
  const json = await res.json();
  return res.ok ? json.files : [];
}

export default function FilesPage() {
  const [files, setFiles] = useState<CsvFileRecord[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFiles = useCallback(() => {
    setLoadingFiles(true);
    loadFiles()
      .then(setFiles)
      .finally(() => setLoadingFiles(false));
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  function handleUpload(_transactions: Transaction[], fileId?: string) {
    void fetchFiles();
    if (fileId) setExpandedId(fileId);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/files/${id}`, { method: "DELETE" });
      setFiles((prev) => prev.filter((f) => f.id !== id));
      if (expandedId === id) setExpandedId(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--accent-glow)" }}
              >
                <FolderOpen size={18} style={{ color: "var(--accent)" }} />
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  Statements
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Upload CSV files and track your finances in one place.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── Upload Section ── */}
        <div
          className="rounded-2xl p-6 mb-10 transition"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--kash-border)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
              Upload statement
            </p>
          </div>

          <UploadBox onUpload={handleUpload} />
        </div>

        {/* ── Files Section ── */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
            Your files
          </p>

          {!loadingFiles && files.length > 0 && (
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{
                background: "var(--bg-hover)",
                color: "var(--text-muted)",
              }}
            >
              {files.length} files
            </span>
          )}
        </div>

        {/* ── Content ── */}
        {loadingFiles ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={18} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Loading your statements…
            </p>
          </div>
        ) : files.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 rounded-2xl"
            style={{
              border: "1px dashed var(--kash-border)",
              background: "var(--bg-surface)",
            }}
          >
            <FileSpreadsheet size={34} style={{ opacity: 0.25 }} />
            <p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>
              No statements yet
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Upload your first CSV to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <StatementCard
                key={file.id}
                file={file}
                isOpen={expandedId === file.id}
                isDeleting={deletingId === file.id}
                onToggle={() =>
                  setExpandedId(expandedId === file.id ? null : file.id)
                }
                onDelete={() => handleDelete(file.id)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}