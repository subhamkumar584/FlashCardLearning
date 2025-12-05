"use client";

import React, { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const StudySageAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"study" | "other">("study");

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // If user explicitly says this is not about studying, short-circuit.
    if (mode === "other") {
      const reply: ChatMessage = {
        role: "assistant",
        content:
          "I can't assist you in that. Please ask me about studying, learning, or general knowledge.",
      };
      setMessages((prev) => [...prev, reply]);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/study-sage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });

      if (!res.ok) {
        const reply: ChatMessage = {
          role: "assistant",
          content:
            "I'm having trouble reaching my brain right now. Please try again in a moment.",
        };
        setMessages((prev) => [...prev, reply]);
        return;
      }

      const data = (await res.json()) as { answer?: string };
      const reply: ChatMessage = {
        role: "assistant",
        content:
          data.answer ??
          "I couldn't generate a helpful answer this time. Please try rephrasing your question.",
      };
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      console.error("StudySage error", err);
      const reply: ChatMessage = {
        role: "assistant",
        content:
          "Something went wrong while contacting StudySage. Please check your connection and try again.",
      };
      setMessages((prev) => [...prev, reply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-2xl bg-slate-900/95 text-slate-100 shadow-2xl border border-slate-700/80 backdrop-blur-md flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/80 bg-slate-900/90">
            <div>
              <div className="text-sm font-semibold">StudySage</div>
              <div className="text-[11px] text-slate-300">
                Your floating AI study buddy.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-slate-100 text-xl leading-none"
              aria-label="Close StudySage"
            >
              ×
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-slate-800 text-[11px]">
            <span className="text-slate-300">Question type:</span>
            <div className="inline-flex rounded-full bg-slate-800/90 p-0.5">
              <button
                type="button"
                onClick={() => setMode("study")}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  mode === "study"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-200 hover:text-white"
                }`}
              >
                Study / general knowledge
              </button>
              <button
                type="button"
                onClick={() => setMode("other")}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  mode === "other"
                    ? "bg-slate-700 text-slate-50"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Other (I won't assist)
              </button>
            </div>
          </div>

          <div className="flex-1 px-4 py-3 space-y-2 overflow-y-auto max-h-72 text-sm">
            {messages.length === 0 && (
              <p className="text-xs text-slate-400">
                Ask StudySage anything about what you're learning—math, history, code, exam prep,
                or general knowledge.
              </p>
            )}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-xs whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-100"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-[11px] text-slate-400">StudySage is thinking…</div>
            )}
          </div>

          <div className="border-t border-slate-700/80 px-3 py-2 bg-slate-950/80">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="w-full text-xs bg-slate-900/80 text-slate-100 rounded-lg px-2 py-1.5 outline-none border border-slate-700 focus:border-indigo-500 resize-none"
              placeholder="Ask a question about what you're studying…"
            />
            <div className="mt-1 flex justify-end">
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-3 py-1.5 text-xs rounded-md font-medium bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors"
              >
                {isLoading ? "Sending…" : "Ask StudySage"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-12 h-12 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-xl flex items-center justify-center text-sm font-semibold border border-indigo-300/60"
        aria-label="Open StudySage assistant"
      >
        SS
      </button>
    </div>
  );
};

export default StudySageAssistant;
