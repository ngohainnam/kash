"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, User, Send, Loader2, FileSpreadsheet, ChevronDown } from "lucide-react";
import type { CsvFileRecord } from "@/app/api/files/route";

interface Message {
  role: "user" | "ai";
  text: string;
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

function toApiHistory(messages: Message[]): ChatMessage[] {
  return messages.map((m) => ({
    role: m.role === "ai" ? "model" : "user",
    text: m.text,
  }));
}

function ChatContent() {
  const params = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<CsvFileRecord[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>("all");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load user files for file selector
  useEffect(() => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((j) => { if (j.files) setFiles(j.files); })
      .catch(() => {});
  }, []);

  // Handle ?q= from ChatBar on home page
  useEffect(() => {
    const q = params.get("q");
    if (!q) return;
    const decoded = decodeURIComponent(q);
    window.history.replaceState({}, "", "/chats");
    setTimeout(() => sendMessage(decoded), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", text: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setLoading(true);

    try {
      const fileIds = selectedFileId === "all" ? undefined : [selectedFileId];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: toApiHistory(newMessages),
          fileIds,
        }),
      });

      const json = await res.json() as { text?: string; error?: string };
      const aiText = json.text ?? json.error ?? "Something went wrong.";
      setMessages((prev) => [...prev, { role: "ai", text: aiText }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Network error - please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>

      {/* ── Header ── */}
      <div
        className="shrink-0 px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--kash-border)", background: "var(--bg-surface)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--accent-glow)" }}
          >
            <Sparkles size={16} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>KASH AI</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Powered by Gemini</p>
          </div>
        </div>

        {/* File selector */}
        {files.length > 0 && (
          <div className="relative flex items-center gap-2">
            <FileSpreadsheet size={13} style={{ color: "var(--text-muted)" }} />
            <div className="relative">
              <select
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                className="appearance-none text-xs pr-6 pl-3 py-1.5 rounded-lg outline-none cursor-pointer"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--kash-border)",
                  color: "var(--text-secondary)",
                }}
              >
                <option value="all">All statements</option>
                {files.map((f) => (
                  <option key={f.id} value={f.id}>{f.fileName}</option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
            <Sparkles size={36} style={{ color: "var(--accent)" }} />
            <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
              Ask me anything about your bank statements.<br />
              <span style={{ color: "var(--text-muted)" }}>e.g. &ldquo;How much did I spend on food last month?&rdquo;</span>
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "ai" && (
              <div
                className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center mt-1"
                style={{ background: "var(--accent-glow)" }}
              >
                <Sparkles size={13} style={{ color: "var(--accent)" }} />
              </div>
            )}
            <div
              className="max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
              style={{
                background: msg.role === "user" ? "var(--accent)" : "var(--bg-card)",
                color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                border: msg.role === "ai" ? "1px solid var(--kash-border)" : "none",
                borderRadius: msg.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
              }}
            >
              {msg.text}
            </div>
            {msg.role === "user" && (
              <div
                className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center mt-1"
                style={{ background: "var(--bg-hover)" }}
              >
                <User size={13} style={{ color: "var(--text-secondary)" }} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div
              className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center mt-1"
              style={{ background: "var(--accent-glow)" }}
            >
              <Sparkles size={13} style={{ color: "var(--accent)" }} />
            </div>
            <div
              className="px-4 py-3 rounded-2xl flex items-center gap-2"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--kash-border)",
                borderRadius: "1rem 1rem 1rem 0.25rem",
              }}
            >
              <Loader2 size={13} className="animate-spin" style={{ color: "var(--accent)" }} />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>Thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div
        className="shrink-0 px-6 py-4"
        style={{ borderTop: "1px solid var(--kash-border)", background: "var(--bg-surface)" }}
      >
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your spending, income, trends…"
            disabled={loading}
            className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--kash-border)",
              minHeight: "44px",
              maxHeight: "120px",
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-opacity"
            style={{
              background: "var(--accent)",
              opacity: loading || !input.trim() ? 0.4 : 1,
            }}
          >
            <Send size={15} color="#fff" />
          </button>
        </form>
        <p className="text-xs mt-2 text-center" style={{ color: "var(--text-muted)" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense>
      <ChatContent />
    </Suspense>
  );
}

