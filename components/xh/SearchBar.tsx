"use client";

/**
 * SearchBar —— 站内搜索（移植自 XHBlogs/components/SearchBar.tsx）
 *
 * 与原版的差异（只动接入层）：
 * 1. 不请求 `/api/search`，也不在客户端拉全量文章：文章索引由页面在构建期通过
 *    `getAllPostMeta()` 取好后，以纯数据 props 传进来；本组件只在浏览器里做匹配。
 * 2. 匹配支持「空格分词 + 多字段（标题/描述/标签/日期）」，命中标题权重更高。
 * 3. 键盘可用：↑↓ 选择、Enter 跳转、Esc 关闭。
 * 4. 日期显示用客户端安全的小工具格式化。
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { formatShortDate } from "./format-date";

export type SearchPost = {
  slug: string;
  title: string;
  description?: string;
  tags?: string[];
  date?: string;
};

export type SearchBarProps = {
  posts?: SearchPost[];
  placeholder?: string;
  /** 最多展示多少条结果 */
  limit?: number;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!text) return null;
  const keyword = query.trim();
  if (!keyword) return <>{text}</>;

  const regex = new RegExp(`(${escapeRegExp(keyword)})`, "gi");
  return (
    <>
      {text.split(regex).map((part, index) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark
            key={index}
            className="mx-[1px] rounded-[4px] bg-indigo-200/80 px-1 font-bold text-slate-900 shadow-sm dark:bg-indigo-500/50 dark:text-white"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export default function SearchBar({
  posts = [],
  placeholder = "搜寻标题、描述或标签...",
  limit = 8,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return [];

    const tokens = keyword.split(/\s+/).filter(Boolean);

    const scored = posts
      .map((post) => {
        const title = (post.title || "").toLowerCase();
        const description = (post.description || "").toLowerCase();
        const tags = (post.tags || []).join(" ").toLowerCase();
        const date = (post.date || "").toLowerCase();
        const haystack = `${title} ${description} ${tags} ${date}`;

        if (!tokens.every((token) => haystack.includes(token))) return null;

        let score = 0;
        for (const token of tokens) {
          if (title.includes(token)) score += 10;
          if (tags.includes(token)) score += 4;
          if (description.includes(token)) score += 2;
          if (date.includes(token)) score += 1;
        }
        if (title === keyword) score += 20;
        return { post, score };
      })
      .filter((item): item is { post: SearchPost; score: number } => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.post);

    return scored;
  }, [posts, query, limit]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const hasQuery = query.trim().length > 0;

  const goTo = (slug: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/posts/${slug}`);
  };

  return (
    <div ref={containerRef} className="relative z-[100] mx-auto mb-10 w-full max-w-2xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const first = results[0];
          if (first) goTo(first.slug);
        }}
      >
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsOpen(false);
                return;
              }
              if (!results.length) return;
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((prev) => (prev + 1) % results.length);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
              }
            }}
            placeholder={placeholder}
            aria-label="站内搜索"
            className="w-full rounded-3xl border border-white/40 bg-white/50 py-4 pl-14 pr-6 text-lg text-slate-800 shadow-xl backdrop-blur-xl transition-all placeholder:text-slate-400 focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <div className="absolute bottom-0 left-0 top-0 z-10 flex items-center pl-5 text-slate-400 dark:text-slate-500">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
      </form>

      <AnimatePresence>
        {isOpen && hasQuery ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full z-20 mt-4 max-h-[450px] overflow-y-auto rounded-3xl border border-white/50 bg-white/90 shadow-2xl backdrop-blur-3xl dark:border-slate-700/50 dark:bg-slate-900/90"
          >
            {results.length > 0 ? (
              <ul className="p-2">
                {results.map((post, index) => (
                  <li key={post.slug}>
                    <Link
                      href={`/posts/${post.slug}`}
                      onClick={() => setIsOpen(false)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`group block rounded-2xl px-4 py-3 transition-colors ${
                        index === activeIndex
                          ? "bg-indigo-50/80 dark:bg-slate-700/50"
                          : "hover:bg-indigo-50/60 dark:hover:bg-slate-700/40"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <h4 className="line-clamp-1 text-sm font-bold text-slate-800 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-300">
                          <Highlight text={post.title} query={query.trim()} />
                        </h4>
                        {post.date ? (
                          <span className="flex-shrink-0 font-mono text-[10px] tracking-wider text-slate-400 dark:text-slate-500">
                            {formatShortDate(post.date)}
                          </span>
                        ) : null}
                      </div>

                      {post.description ? (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                          <Highlight text={post.description} query={query.trim()} />
                        </p>
                      ) : null}

                      {post.tags && post.tags.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-500 dark:bg-slate-700/60 dark:text-indigo-300"
                            >
                              <svg
                                className="h-2.5 w-2.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
                                />
                              </svg>
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  数据海中未发现关于 &ldquo;{query.trim()}&rdquo; 的踪迹
                </p>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
