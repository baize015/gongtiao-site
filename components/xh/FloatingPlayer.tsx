"use client";

/**
 * FloatingPlayer —— 可拖拽的悬浮播放胶囊（移植自 XHBlogs/components/FloatingPlayer.tsx）
 *
 * 与原版的差异（只动接入层）：
 * 1. 数据全部来自本地 MusicProvider，没有外部请求；
 * 2. 首页隐藏（原版行为，避免和首页的 CloudPlayer/LyricBar 重复），如需常驻把 isHidden 改成 false；
 * 3. 无封面时用渐变圆盘兜底。
 *
 * 必须包在 <MusicProvider> 内使用。
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useMusic } from "./MusicProvider";

export default function FloatingPlayer() {
  const { currentSong, isPlaying, togglePlay, nextSong, currentLyric, isLoading } = useMusic();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isLoading || !currentSong) return null;

  const isHidden = pathname === "/";

  return (
    <div className="fixed bottom-6 right-6 z-[9999]" style={{ pointerEvents: "none" }}>
      <motion.div
        drag
        dragMomentum={false}
        style={{ touchAction: "none" }}
        animate={{
          opacity: isHidden ? 0 : 1,
          scale: isHidden ? 0.8 : 1,
          pointerEvents: isHidden ? "none" : "auto",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex cursor-grab items-center gap-4 rounded-full border border-white/40 bg-white/70 p-2 pr-5 shadow-2xl backdrop-blur-xl active:cursor-grabbing dark:border-white/10 dark:bg-slate-800/80"
      >
        {/* 旋转封面 */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md dark:border-slate-600">
          {currentSong.cover ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentSong.cover}
              alt={currentSong.title}
              className="h-full w-full animate-[spin_6s_linear_infinite] object-cover"
              style={{ animationPlayState: isPlaying ? "running" : "paused" }}
            />
          ) : (
            <div
              className="flex h-full w-full animate-[spin_6s_linear_infinite] items-center justify-center text-white"
              style={{ animationPlayState: isPlaying ? "running" : "paused" }}
            >
              <span className="h-2 w-2 rounded-full bg-white/80" />
            </div>
          )}
        </div>

        {/* 曲目信息 */}
        <div className="w-32 max-w-[120px] overflow-hidden pr-2">
          <div className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
            {currentSong.title}
          </div>
          <div className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {currentLyric}
          </div>
        </div>

        {/* 控制键 */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={isPlaying ? "暂停" : "播放"}
            onClick={(event) => {
              event.stopPropagation();
              togglePlay();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-all hover:bg-indigo-500 hover:text-white dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-indigo-600"
          >
            {isPlaying ? (
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
              event.stopPropagation();
              nextSong();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
