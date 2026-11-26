"use client";

/**
 * LyricBar —— 横贯首页的歌词条（移植自 XHBlogs/components/LyricBar.tsx）
 *
 * 与原版的差异：只把数据源换成本站 MusicProvider，其它（打字机、声波、音符）保持不变。
 * 必须包在 <MusicProvider> 内使用；没有正在播放的歌时自动隐藏。
 */

import { useEffect, useState } from "react";
import { useMusic } from "./MusicProvider";

const BAR_STYLES = `
@keyframes gt-cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
@keyframes gt-safe-wave { 0%, 100% { height: 8px; } 50% { height: 28px; } }
.gt-cursor { animation: gt-cursor-blink 1s step-end infinite; }
.gt-wave-active { animation: gt-safe-wave 1s ease-in-out infinite; }
`;

export default function LyricBar() {
  const { isPlaying, currentLyric, currentSong } = useMusic();
  const [displayText, setDisplayText] = useState("");

  const targetText = currentLyric || currentSong?.title || "";

  // 打字机
  useEffect(() => {
    if (!targetText) {
      setDisplayText("");
      return;
    }

    let index = 0;
    setDisplayText("");

    const timer = setInterval(() => {
      index += 1;
      setDisplayText(targetText.slice(0, index));
      if (index >= targetText.length) clearInterval(timer);
    }, 50);

    return () => clearInterval(timer);
  }, [targetText]);

  if (!currentSong) return null;

  const barHeights = [0, 200, 400, 100, 300];

  return (
    <div className="flex h-20 w-full items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-xl dark:bg-slate-950/90">
      <style>{BAR_STYLES}</style>

      {/* 声波 */}
      <div className="flex h-8 flex-shrink-0 items-end gap-1">
        {barHeights.map((delay, index) => (
          <span
            key={index}
            className={`gt-wave-active w-1.5 rounded-t-sm ${
              isPlaying
                ? ["bg-indigo-400", "bg-indigo-400", "bg-indigo-500", "bg-purple-400", "bg-purple-500"][index]
                : "h-1 bg-slate-600"
            }`}
            style={isPlaying ? { animationDelay: `${delay}ms` } : undefined}
          />
        ))}
      </div>

      {/* 歌词 */}
      <div className="mx-4 flex flex-1 items-center justify-center overflow-hidden">
        <span className="truncate text-center text-lg font-bold tracking-widest text-white">
          {displayText}
        </span>
        {isPlaying ? <span className="gt-cursor ml-1 inline-block h-5 w-[2px] bg-indigo-400" /> : null}
      </div>

      {/* 音符 */}
      <div className={`flex-shrink-0 text-indigo-400 ${isPlaying ? "animate-bounce" : "opacity-50"}`}>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19V6l12-3v13M9 19a3 3 0 11-6 0 3 3 0 016 0zm12-3a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
    </div>
  );
}
