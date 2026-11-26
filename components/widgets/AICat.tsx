"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/site.config";
import { IconClose, IconPaw } from "@/components/ui/Icons";

type Msg = { role: "user" | "assistant"; content: string; offline?: boolean };

const { aiCat } = siteConfig;

const greeting = `喵……又有人上山了。我是${aiCat.name}，随便聊聊吧。`;

export default function AICat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: greeting }]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open, busy]);

  if (!aiCat.enabled) return null;

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => m.role === "user" || m.role === "assistant").slice(-12),
        }),
      });
      const data = (await res.json()) as { reply?: string; offline?: boolean; error?: string };
      setMsgs((cur) => [
        ...cur,
        {
          role: "assistant",
          content: data.reply || data.error || "喵？信号被雾吃掉了。",
          offline: data.offline,
        },
      ]);
    } catch {
      setMsgs((cur) => [
        ...cur,
        { role: "assistant", content: "喵……山里信号不太好，等一下再试试。", offline: true },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open ? (
        <div className="glass w-[min(20rem,calc(100vw-2.5rem))] flex flex-col overflow-hidden fade-up">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--line)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={aiCat.avatar} alt={aiCat.name} className="w-8 h-8 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-[0.85rem] leading-tight">{aiCat.name}</p>
              <p className="text-[0.68rem] text-[var(--ink-faint)] leading-tight">住在山里的猫</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="收起"
              className="text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
            >
              <IconClose size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="max-h-72 overflow-y-auto px-3.5 py-3 space-y-2.5">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={[
                    "max-w-[85%] rounded-2xl px-3 py-2 text-[0.82rem] leading-relaxed whitespace-pre-wrap",
                    m.role === "user"
                      ? "bg-[var(--accent)] text-white rounded-br-md"
                      : "bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--ink)] rounded-bl-md",
                  ].join(" ")}
                >
                  {m.content}
                </p>
              </div>
            ))}
            {busy ? (
              <div className="flex justify-start">
                <span className="rounded-2xl rounded-bl-md px-3 py-2 bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--ink-faint)] text-[0.8rem]">
                  山雾正在思考…
                </span>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 px-3 py-2.5 border-t border-[var(--line)]"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={aiCat.placeholder}
              maxLength={200}
              className="flex-1 bg-transparent text-[0.82rem] outline-none placeholder:text-[var(--ink-faint)]"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="text-[0.78rem] px-2.5 py-1 rounded-full bg-[var(--accent)] text-white disabled:opacity-40 transition-opacity"
            >
              说
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`和${aiCat.name}聊天`}
        className="glass glass-hover relative grid place-items-center w-12 h-12 rounded-full"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={aiCat.avatar} alt={aiCat.name} className="w-9 h-9 float-soft" />
        <span className="absolute -top-1 -right-1 grid place-items-center w-4 h-4 rounded-full bg-[var(--warm)] text-[#3a3222]">
          <IconPaw size={9} />
        </span>
      </button>
    </div>
  );
}
