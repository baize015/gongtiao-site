"use client";

/**
 * CloudPlayer —— 首页右侧的「雾中电台」卡片（移植自 XHBlogs/components/CloudPlayer.tsx）
 *
 * 与原版的差异（只动接入层）：
 * 1. 数据来自本地 MusicProvider，不再有「CONNECTING 拉歌单」的等待；
 * 2. 点击整卡跳 `/music`；
 * 3. 封面为空时用渐变圆盘；没有歌单时渲染一张安静的提示卡，不报错。
 *
 * 必须包在 <MusicProvider> 内使用。
 */

import { useEffect, useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { useMusic } from "./MusicProvider";
import { formatDuration } from "./format-date";

const PLAYER_STYLES = `
@keyframes gt-safe-wave-mini { 0%, 100% { height: 6px; } 50% { height: 22px; } }
.gt-mini-wave { animation: gt-safe-wave-mini 1s ease-in-out infinite; }
.gt-range { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 999px; outline: none; }
.gt-range::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none; width: 12px; height: 12px; border-radius: 50%;
  background: #818cf8; border: 2px solid #fff; box-shadow: 0 0 6px rgba(129, 140, 248, 0.8); cursor: pointer;
}
.gt-range::-moz-range-thumb {
  width: 12px; height: 12px; border-radius: 50%; background: #818cf8; border: 2px solid #fff; cursor: pointer;
}
`;

export default function CloudPlayer() {
  const {
    playlist,
    currentSong,
    isPlaying,
    progress,
    currentTime,
    duration,
    currentLyric,
    isLoading,
    togglePlay,
    nextSong,
    prevSong,
    handleSeek,
  } = useMusic();

  const router = useRouter();
  const [displayLyric, setDisplayLyric] = useState("");

  const targetLyric = currentLyric || currentSong?.title || "";

  useEffect(() => {
    if (!targetLyric) {
      setDisplayLyric("");
      return;
    }

    let index = 0;
    setDisplayLyric("");
    const timer = setInterval(() => {
      index += 1;
      setDisplayLyric(targetLyric.slice(0, index));
      if (index >= targetLyric.length) clearInterval(timer);
    }, 50);

    return () => clearInterval(timer);
  }, [targetLyric]);

  const stop = (event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  if (playlist.length === 0 || !currentSong) {
    return (
      <div className="flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-3xl border border-white/40 bg-white/40 p-8 text-center shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-800/50">
        <span className="text-3xl text-slate-300 dark:text-slate-600">♪</span>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">电台还没开播</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          在 site.config.ts 的 music.playlist 里填上音频地址即可
        </p>
      </div>
    );
  }

  return (
    <div
      onClick={() => router.push("/music")}
      className="group relative flex h-full min-h-[220px] w-full cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-white/40 bg-white/40 p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] active:duration-75 dark:border-white/10 dark:bg-slate-800/50"
    >
      <style>{PLAYER_STYLES}</style>

      {/* 光斑 */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-400/25 blur-2xl dark:bg-indigo-500/20" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/60 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg dark:border-slate-700">
            {currentSong.cover ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={currentSong.cover}
                alt={currentSong.title}
                className="h-full w-full animate-[spin_12s_linear_infinite] object-cover"
                style={{ animationPlayState: isPlaying ? "running" : "paused" }}
              />
            ) : (
              <span className="h-3 w-3 rounded-full bg-white/80" />
            )}
          </div>

          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
              Cloud Music
            </span>
            <h3 className="mt-1 truncate text-lg font-bold text-slate-800 dark:text-slate-100">
              {currentSong.title}
            </h3>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{currentSong.artist}</p>
          </div>
        </div>

        {/* 迷你声波 */}
        <div className={`flex h-8 flex-shrink-0 items-end gap-1 ${isPlaying ? "" : "opacity-40"}`}>
          {[0, 150, 300, 75].map((delay, index) => (
            <span
              key={index}
              className={`w-1 rounded-t-sm ${
                isPlaying ? "gt-mini-wave bg-indigo-400" : "h-1 bg-slate-400"
              }`}
              style={isPlaying ? { animationDelay: `${delay}ms` } : undefined}
            />
          ))}
        </div>
      </div>

      {/* 歌词 */}
      <p className="relative z-10 mt-4 line-clamp-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
        {displayLyric}
        {isPlaying ? <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-indigo-400 align-middle" /> : null}
      </p>

      {/* 进度条 */}
      <div className="relative z-10 mt-3" onClick={stop}>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => {
            stop(event);
            handleSeek(event);
          }}
          aria-label="播放进度"
          className="gt-range w-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, #818cf8 ${progress}%, rgba(148, 163, 184, 0.4) ${progress}%)`,
          }}
        />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500 dark:text-slate-400">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* 控制键 */}
      <div className="relative z-10 mt-2 flex items-center gap-2" onClick={stop}>
        <button
          type="button"
          aria-label="上一首"
          onClick={(event) => {
            stop(event);
            prevSong();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 6l-8.5 6L18 18V6zM6 6h2v12H6V6z" />
          </svg>
        </button>

        <button
          type="button"
          aria-label={isPlaying ? "暂停" : "播放"}
          onClick={(event) => {
            stop(event);
            togglePlay();
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 dark:bg-indigo-600"
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : isPlaying ? (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          aria-label="下一首"
          onClick={(event) => {
            stop(event);
            nextSong();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
