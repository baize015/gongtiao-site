"use client";

/**
 * LatestPostsCarousel —— 首页最新文章轮播（移植自 XHBlogs/components/LatestPostsCarousel.tsx）
 *
 * 与原版的差异（只动接入层）：
 * 1. 根节点去掉 md:col-span-4，改为 w-full h-full，栅格跨度由页面外层决定；
 * 2. 数据用本地类型 CarouselPost（页面把 PostMeta 直接传进来即可，字段同构）；
 * 3. 日期用客户端安全的小工具格式化，不再依赖 remixicon 图标；
 * 4. 封面为空时回退 siteConfig.defaultPostCover。
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { siteConfig } from "@/site.config";
import { formatShortDate } from "./format-date";

export type CarouselPost = {
  slug: string;
  title: string;
  description?: string;
  cover?: string;
  /** 2026-11-18 或 2026-11-18 09:30 */
  date?: string;
  /** 已经格式化好的日期（可选，优先使用） */
  formattedDate?: string;
  tags?: string[];
};

export type LatestPostsCarouselProps = {
  posts: CarouselPost[];
};

export default function LatestPostsCarousel({ posts }: LatestPostsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!posts || posts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [posts]);

  useEffect(() => {
    if (currentIndex >= posts.length) setCurrentIndex(0);
  }, [posts.length, currentIndex]);

  if (!posts || posts.length === 0) return null;

  const currentPost = posts[currentIndex] ?? posts[0];
  const dateText = currentPost.formattedDate || formatShortDate(currentPost.date);
  const cover = currentPost.cover || siteConfig.defaultPostCover;

  return (
    <div className="group relative flex h-full min-h-[420px] w-full flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/40 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-800/50">
      <Link
        href={currentPost.slug === "none" ? "#" : `/posts/${currentPost.slug}`}
        className="absolute inset-0 z-20"
        aria-label={currentPost.title}
      />

      {/* 背景大图 */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPost.slug}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt={currentPost.title}
              className="h-full w-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      </div>

      {/* 文字区 */}
      <div className="pointer-events-none relative z-10 mt-auto flex flex-col justify-end p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-indigo-500/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg backdrop-blur-lg">
            Latest Insight
          </span>
          {dateText ? (
            <span className="flex items-center rounded-full border border-white/20 bg-black/40 px-2 py-1 font-mono text-[10px] tracking-wider text-white/90 backdrop-blur-md">
              <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {dateText}
            </span>
          ) : null}
        </div>

        <h2 className="mb-2 line-clamp-2 text-2xl font-bold leading-snug text-white">{currentPost.title}</h2>

        {currentPost.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-gray-300">{currentPost.description}</p>
        ) : null}
      </div>

      {/* 指示点 */}
      {posts.length > 1 ? (
        <div className="absolute bottom-4 right-6 z-30 flex gap-2">
          {posts.map((post, index) => (
            <button
              key={`${post.slug}-${index}`}
              type="button"
              aria-label={`切换到第 ${index + 1} 篇文章`}
              onClick={(event) => {
                event.preventDefault();
                setCurrentIndex(index);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? "w-6 bg-indigo-400" : "w-2 bg-white/40 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
