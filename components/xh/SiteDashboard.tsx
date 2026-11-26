"use client";

/**
 * SiteDashboard —— 首页底部的站点数据小面板（移植自 XHBlogs/components/SiteDashboard.tsx）
 *
 * 与原版的差异（只动接入层）：
 * 1. 原版读 siteConfig.icpConfig，本站在 siteConfig.footer.icp（{ name, link } | null）；
 * 2. 根节点去掉 md:col-span-12，改为 w-full，栅格交给页面外层；
 * 3. 时间/运行时长全部在 useEffect 里算，首帧渲染固定占位，不会 hydration 不一致。
 */

import { useEffect, useState } from "react";
import { siteConfig } from "@/site.config";

export default function SiteDashboard() {
  const [timeStr, setTimeStr] = useState("--:--:--");
  const [uptimeStr, setUptimeStr] = useState("--");

  useEffect(() => {
    const startTime = new Date(`${siteConfig.buildDate || "2026-03-23"}T00:00:00`).getTime();

    const tick = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );

      const diff = Date.now() - startTime;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setUptimeStr(`${days} 天 ${hours} 小时`);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const icp = siteConfig.footer?.icp ?? null;
  const badges = siteConfig.footerBadges ?? [];

  return (
    <div className="group flex h-auto w-full flex-col items-stretch overflow-hidden rounded-3xl border border-white/40 bg-white/40 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-800/50 md:h-20 md:flex-row">
      {/* 翻页时钟 */}
      <div className="relative flex items-center justify-center bg-slate-900 px-8 py-4 font-mono text-2xl font-black tracking-widest text-white dark:bg-black md:text-3xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-black/50" />
        <span className="relative z-10">{timeStr}</span>
      </div>

      {/* 信息条 */}
      <div className="flex flex-1 flex-wrap items-center justify-between gap-4 px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300 md:text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>系统已稳定运行：</span>
          <span className="font-mono text-indigo-600 dark:text-indigo-400">{uptimeStr}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {badges.map((badge) => (
            <span
              key={badge.name}
              className="flex items-center gap-1 rounded-md border border-white/40 bg-white/50 px-2 py-1 shadow-sm dark:border-slate-600 dark:bg-slate-700/50"
            >
              <svg
                className={`h-3.5 w-3.5 ${badge.color}`}
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: badge.svg }}
              />
              {badge.name}
            </span>
          ))}

          {icp ? (
            <a
              href={icp.link}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {icp.name}
            </a>
          ) : null}

          <span className="hidden text-[0.7rem] font-medium tracking-wider text-slate-400 dark:text-slate-500 sm:inline">
            © {siteConfig.footer?.since ?? 2026} {siteConfig.authorName}
          </span>
        </div>
      </div>
    </div>
  );
}
