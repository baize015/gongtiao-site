/**
 * 客户端安全的日期格式化。
 *
 * 为什么不用 `@/lib/content` 里的 formatDate？
 * 那个模块顶层 `import fs from "node:fs"`，被 `"use client"` 组件引入会污染浏览器包。
 * 这里只做纯计算，服务端 / 客户端都能用。
 */

/** 2026-11-18 / 2026-11-18 09:30 → 2026.11.18 */
export function formatShortDate(value?: string | null): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const date = new Date(raw.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return raw.slice(0, 10).replace(/-/g, ".");

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

/** 秒数 → mm:ss */
export function formatDuration(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
