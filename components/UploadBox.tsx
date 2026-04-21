"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Transaction } from "@/app/api/upload/route";
import { CheckCircle2, FileText, AlertCircle, Loader2, UploadIcon } from "lucide-react";

interface Props {
  onUpload: (transactions: Transaction[], fileId?: string) => void;
}

export default function UploadBox({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  async function handleFile(selectedFile: File) {
    setError(null);
    setFile(selectedFile);
    setProgress(0);
    clearTimers();

    // Animate progress bar while uploading
    intervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearTimers();
          return prev;
        }
        return prev + 4;
      });
    }, 80);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      clearTimers();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        setFile(null);
        setProgress(0);
        return;
      }
      setProgress(100);
      setTimeout(() => {
        onUpload(json.transactions as Transaction[], json.fileId as string | undefined);
      }, 600);
    } catch {
      clearTimers();
      setError("Something went wrong. Please try again.");
      setFile(null);
      setProgress(0);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  return (
    <div className="w-full">
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-10 flex flex-col items-center gap-4"
          style={{
            borderColor: isDragging ? "var(--accent)" : "var(--border)",
            background: isDragging ? "var(--accent-glow)" : "var(--bg-card)",
            boxShadow: isDragging ? "0 0 0 4px var(--accent-glow)" : "none",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleChange}
          />

          {/* Icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-200"
            style={{
              background: isDragging ? "var(--accent)" : "var(--accent-glow)",
              transform: isDragging ? "scale(1.1)" : "scale(1)",
            }}
          >
            <UploadIcon size={24} style={{ color: isDragging ? "#fff" : "var(--accent)" }} />
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Click to upload or drag and drop
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              CSV files only
            </p>
          </div>

          {/* Required columns pill */}
          <div
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
            style={{
              background: "var(--bg-hover)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            <FileText size={11} />
            Required columns: Date, Description, Amount
          </div>
        </div>
      ) : (
        /* Upload progress state */
        <div
          className="rounded-2xl p-8 flex flex-col items-center gap-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {/* Status icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--accent-glow)" }}
          >
            {progress >= 100 ? (
              <CheckCircle2 size={26} style={{ color: "var(--accent)" }} />
            ) : (
              <Loader2 size={26} className="animate-spin" style={{ color: "var(--accent)" }} />
            )}
          </div>

          {/* File name */}
          <div className="text-center">
            <p className="text-sm font-semibold truncate max-w-xs" style={{ color: "var(--text-primary)" }}>
              {file.name}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {progress < 100 ? "Analyzing your bank statement…" : "Done! Loading results…"}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-sm">
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--bg-hover)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${progress}%`,
                  background: progress >= 100
                    ? "linear-gradient(90deg, var(--accent), var(--accent-2))"
                    : "var(--accent)",
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {progress >= 100 ? "Complete" : "Processing…"}
              </span>
              <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                {progress}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mt-3 flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl"
          style={{
            background: "rgba(239,68,68,0.1)",
            color: "var(--red)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <AlertCircle size={13} />
          {error}
        </div>
      )}
    </div>
  );
}
