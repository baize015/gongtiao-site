"use client";

/**
 * ClientTOC —— 文章详情页右侧目录（移植自 XHBlogs/components/ClientTOC.tsx）
 *
 * 与原版的差异（只动接入层，这点很重要）：
 * 1. 原版会**强制重写**每个标题的 id，破坏 rehype-slug 生成的外链锚点。
 *    这里改成「已有 id 就保留，没有才补」，因此 `#标题` 外链不会失效。
 * 2. 原版只认 `#article-content`，本站正文容器是 `.prose-gt` 且暂时没有 id，
 *    所以支持 `contentId` 与 `selector` 两级查找。
 * 3. `toc` 变成可选：不传时组件自己扫描正文 DOM 生成目录；
 *    传了则优先使用 DOM（真实 id 更可靠），DOM 找不到时回落到 props。
 * 4. 目录内容是 DOM 扫描结果，首帧为空、挂载后填充，因此不需要页面在服务端算 TOC。
 */

import { useEffect, useMemo, useRef, useState } from "react";

export type TocItem = {
  level: number;
  text: string;
  /** 不传则按标题文字生成 */
  id?: string;
};

export type ClientTOCProps = {
  /** 可选：服务端预先算好的目录。不传则自动扫描正文 */
  toc?: TocItem[];
  /** 正文容器 id，默认 article-content */
  contentId?: string;
  /** 正文容器兜底选择器，默认 .prose-gt */
  selector?: string;
  title?: string;
  className?: string;
};

/** 去掉 Markdown / HTML 残留，只留纯文字 */
function cleanMarkdownHeading(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [文本](url)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // 图片
    .replace(/<[^>]+>/g, "") // HTML 标签
    .replace(/[*_~`#]/g, "") // 强调符号
    .replace(/\s+/g, " ")
    .trim();
}

/** 生成稳定的锚点 id（尽量保留中日韩字符） */
function getSafeId(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\u3040-\u30ff]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `toc-${normalized || "section"}`;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function ClientTOC({
  toc,
  contentId = "article-content",
  selector = ".prose-gt",
  title = "Table of Contents",
  className = "",
}: ClientTOCProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const frameRef = useRef<number | null>(null);

  const tocKey = useMemo(() => JSON.stringify(toc ?? []), [toc]);
  // 用 ref 读 toc，避免父组件每次渲染传新数组时把 effect 反复触发
  const tocRef = useRef(toc);
  tocRef.current = toc;

  // ① 收集标题：优先扫真实 DOM（rehype-slug 给的 id 才准），其次用 props.toc
  useEffect(() => {
    const collect = () => {
      const container =
        document.getElementById(contentId) || document.querySelector<HTMLElement>(selector);

      if (container) {
        const headings = Array.from(container.querySelectorAll<HTMLElement>("h1, h2, h3"));
        const next = headings
          .map((heading) => {
            const text = cleanMarkdownHeading(heading.textContent || "");
            if (!text) return null;
            if (!heading.id) heading.id = getSafeId(text); // 保留已有 id（rehype-slug）
            return { level: Number(heading.tagName.substring(1)) || 2, text, id: heading.id };
          })
          .filter((item): item is { level: number; text: string; id: string } => item !== null);

        if (next.length > 0) {
          setItems(next);
          return;
        }
      }

      // 正文还没渲染出来时回落到 props
      const fallbackToc = tocRef.current;
      if (fallbackToc && fallbackToc.length > 0) {
        setItems(
          fallbackToc.map((item) => ({
            level: item.level,
            text: cleanMarkdownHeading(item.text),
            id: item.id || getSafeId(item.text),
          })),
        );
      } else {
        setItems([]);
      }
    };

    collect();
    // 正文可能是异步渲染 / 图片撑开导致位置变化，再补一次
    const retry = window.setTimeout(collect, 400);
    return () => window.clearTimeout(retry);
  }, [contentId, selector, tocKey]);

  // ② 滚动高亮
  useEffect(() => {
    if (items.length === 0) return;

    const onScroll = () => {
      let currentId = items[0]?.id ?? null;
      const offset = 150;

      for (const item of items) {
        if (!item.id) continue;
        const element = document.getElementById(item.id);
        if (!element) continue;
        if (element.getBoundingClientRect().top + window.scrollY - offset <= window.scrollY) {
          currentId = item.id;
        } else {
          break;
        }
      }

      setActiveId(currentId);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const scrollToHeading = (event: React.MouseEvent<HTMLButtonElement>, id?: string) => {
    event.preventDefault();
    if (!id) return;

    const element = document.getElementById(id);
    if (!element) return;

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

    const startY = window.scrollY;
    const targetY = element.getBoundingClientRect().top + startY - 100;
    const distance = targetY - startY;
    const duration = 600;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = Math.min(now - startTime, duration);
      const progress = elapsed / duration;
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (elapsed < duration) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    setActiveId(id);
  };

  if (items.length === 0) return null;

  return (
    <div
      className={`sticky top-28 max-h-[75vh] overflow-y-auto rounded-3xl border border-white/40 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/50 ${className}`}
    >
      <h3 className="mb-4 border-l-4 border-indigo-500 pl-2 text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
        {title}
      </h3>

      <nav className="relative">
        <div className="absolute bottom-0 left-0 top-0 w-[2px] bg-slate-200 dark:bg-slate-700/50" />

        <ul className="flex flex-col">
          {items.map((item, index) => {
            const isActive = item.id === activeId;
            return (
              <li key={`${item.id ?? item.text}-${index}`} className="relative">
                {isActive ? (
                  <span className="absolute left-[-5px] top-1/2 h-[6px] w-[6px] -translate-y-1/2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                ) : null}

                <button
                  type="button"
                  onClick={(event) => scrollToHeading(event, item.id)}
                  className={`block w-full pl-4 text-left leading-relaxed transition-all duration-300 ${
                    item.level === 1 ? "mt-2 font-bold" : item.level === 2 ? "ml-2" : "ml-4 text-xs"
                  } ${
                    isActive
                      ? "origin-left scale-105 font-bold text-indigo-600 dark:text-indigo-400"
                      : "text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-300"
                  }`}
                >
                  <span className="line-clamp-2">{item.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
