"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type PosterSlide = {
  src: string;
  album: string;
  /** 照片标题，可能为空 */
  title?: string;
  /** 所属相册的说明，照片没标题时用它当副标题 */
  desc?: string;
};

type Props = {
  slides: readonly PosterSlide[];
  fallbackName?: string;
  fallbackDesc?: string;
  /** 每次切换的间隔（毫秒） */
  interval?: number;
};

/**
 * 首页照片墙大海报：自动轮换相册里上传的照片。
 * - 悬停或触屏按住时暂停，移开继续
 * - 系统开了「减少动态效果」就不自动轮换，只显示第一张
 * - 只在当前、上一张和下一张之间做淡入淡出，避免一次性加载全部大图
 */
export default function AlbumPoster({
  slides,
  fallbackName = "相册",
  fallbackDesc = "山里、路上、窗边",
  interval = 4200,
}: Props) {
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const preloaded = useRef(new Set<string>());

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (total < 2 || paused || reduced) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, interval);
    return () => window.clearInterval(timer);
  }, [total, paused, reduced, interval]);

  // 预加载下一张，切换时不会白屏
  useEffect(() => {
    if (total < 2) return;
    const next = slides[(index + 1) % total];
    if (!next || preloaded.current.has(next.src)) return;
    preloaded.current.add(next.src);
    const image = new window.Image();
    image.src = next.src;
  }, [index, slides, total]);

  const go = useCallback(
    (delta: number) => {
      if (total < 2) return;
      setIndex((current) => (current + delta + total) % total);
    },
    [total],
  );

  const active = slides[index];
  const name = active?.album || fallbackName;
  const caption = active?.title || active?.desc || fallbackDesc;

  return (
    <Link
      href="/photos"
      aria-label={`相册：${name}，共 ${total || 0} 张照片`}
      className="group relative flex min-h-[200px] w-full shrink-0 items-center overflow-hidden rounded-3xl border border-white/40 bg-white/40 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] active:duration-75 dark:border-white/10 dark:bg-slate-800/50 sm:min-h-[220px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {active ? (
        <img
          key={active.src}
          src={active.src}
          alt={active.title ? `${name} · ${active.title}` : name}
          className="absolute inset-0 h-full w-full object-cover opacity-90 transition-[opacity,transform] duration-500 group-hover:scale-105"
          style={{ animation: reduced ? undefined : "gt-poster-fade 620ms ease-out both" }}
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
        />
      ) : null}

      <div className="absolute inset-0 bg-slate-900/35 transition-colors duration-500 group-hover:bg-slate-900/15 dark:bg-slate-950/55" />

      <div className="absolute bottom-4 left-4 right-16 sm:bottom-6 sm:left-6">
        <h3 className="mb-1 font-serif text-2xl text-white underline decoration-[#e6d3b3] underline-offset-4 sm:mb-2 sm:text-3xl">
          {name}
        </h3>
        <p key={caption} className="line-clamp-1 text-sm text-white/90 sm:text-base">
          {caption}
        </p>
      </div>

      {total > 1 ? (
        <div className="absolute bottom-5 right-5 flex items-center gap-1.5 sm:bottom-7 sm:right-6">
          {slides.map((slide, dotIndex) => (
            <button
              key={`${slide.src}-${dotIndex}`}
              type="button"
              aria-label={`第 ${dotIndex + 1} 张`}
              onClick={(event) => {
                event.preventDefault();
                setIndex(dotIndex);
              }}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: dotIndex === index ? 18 : 6,
                background: dotIndex === index ? "var(--warm)" : "rgba(255,255,255,0.55)",
              }}
            />
          ))}
        </div>
      ) : null}
    </Link>
  );
}
