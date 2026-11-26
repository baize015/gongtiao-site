"use client";

/**
 * SidebarLyric —— 文章页右侧「正在播放」（移植自 XHBlogs/components/SidebarLyric.tsx）
 *
 * 与原版的差异：只换数据源；没有播放中的歌时返回 null（不占位）。
 * 必须包在 <MusicProvider> 内使用。
 */

import { useEffect, useState } from "react";
import { useMusic } from "./MusicProvider";

export default function SidebarLyric() {
  const { currentSong, isPlaying, currentLyric } = useMusic();
  const [displayText, setDisplayText] = useState("");

  const targetText = currentLyric || currentSong?.title || "";

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

  return (
    <div className="rounded-3xl border border-white/40 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/50">
      <h3 className="mb-4 border-l-4 border-indigo-500 pl-2 text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
        Now Playing
      </h3>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md dark:border-slate-600">
          {currentSong.cover ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentSong.cover}
              alt={currentSong.title}
              className="h-full w-full animate-[spin_8s_linear_infinite] object-cover"
              style={{ animationPlayState: isPlaying ? "running" : "paused" }}
            />
          ) : (
            <span className="h-2 w-2 rounded-full bg-white/80" />
          )}
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
            {currentSong.title}
          </div>
          <div className="truncate text-xs text-slate-500 dark:text-slate-400">{currentSong.artist}</div>
        </div>
      </div>

      <div className="flex min-h-[60px] items-center justify-center rounded-xl bg-slate-100/50 p-3 text-center dark:bg-slate-900/50">
        <p className="text-xs font-bold leading-relaxed text-indigo-600 dark:text-indigo-400">
          {displayText}
          {isPlaying ? <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-indigo-400 align-middle" /> : null}
        </p>
      </div>
    </div>
  );
}
