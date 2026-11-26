"use client";

import { useEffect, useRef, useState } from "react";

/** 友链申请格式：等宽展示 + 一键复制 */
export default function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current !== undefined) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 浏览器不给权限时，用户仍可手动选中复制 */
    }
  }

  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2.5">
        <p className="kicker">申请格式</p>
        <button type="button" onClick={copy} className="btn-ghost px-3 py-1 text-[0.75rem]" aria-live="polite">
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-4 font-mono text-[0.8rem] leading-[1.9] text-[var(--ink-soft)]">
        {text}
      </pre>
    </div>
  );
}
