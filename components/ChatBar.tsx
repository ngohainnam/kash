"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SendHorizonal, Sparkles } from "lucide-react";

export default function ChatBar() {
  const [input, setInput] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg) return;
    // Navigate to chats with the message as a query param
    router.push(`/chats?q=${encodeURIComponent(msg)}`);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <div
      className="shrink-0 border-t px-4 py-3"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        {/* Sparkle icon */}
        <div
          className="shrink-0 mb-1 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "var(--accent-glow)" }}
        >
          <Sparkles size={14} style={{ color: "var(--accent)" }} />
        </div>

        {/* Textarea */}
        <textarea
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Auto-grow up to 5 lines
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI about your finances… (Enter to send)"
          className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            minHeight: "42px",
            maxHeight: "120px",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!input.trim()}
          className="shrink-0 mb-0.5 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: input.trim() ? "var(--accent)" : "var(--bg-hover)",
            cursor: input.trim() ? "pointer" : "not-allowed",
          }}
        >
          <SendHorizonal size={15} color={input.trim() ? "#fff" : "var(--text-muted)"} />
        </button>
      </form>
    </div>
  );
}
