"use client";

/**
 * LatestChatterCarousel —— 最新碎碎念轮播（移植自 XHBlogs/components/LatestChatterCarousel.tsx）
 *
 * 与原版的差异（只动接入层）：
 * 1. 原版跳 `/chatter/${slug}`，本站碎碎念没有独立路由，统一跳 `/moments`（可用 href 覆盖）；
 * 2. 数据用本地类型 CarouselChatter，兼容 Moment：把 content 映射成 description、mood 映射成 mood；
 * 3. 没有封面时用「雾蓝渐变 + 引号」兜底，不引用外站图片；
 * 4. 根节点保持 w-full h-full（原版已去掉 md:col-span-8）。
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { formatShortDate } from "./format-date";

export type CarouselChatter = {
  /** 碎碎念 id（用作 key） */
  id?: string;
  /** 覆盖默认跳转地址，默认 /moments */
  href?: string;
  /** 小标题，缺省用 mood 或「碎碎念」 */
  title?: string;
  /** 正文（Moment.content 直接传进来） */
  description?: string;
  cover?: string;
  date?: string;
  formattedDate?: string;
  /** 心情标签 */
  mood?: string;
};

export type LatestChatterCarouselProps = {
  chatters: CarouselChatter[];
};

const holoVariants = {
  initial: { opacity: 0, scale: 0.95, filter: "blur(10px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 1.05, filter: "blur(10px)" },
};

export default function LatestChatterCarousel({ chatters }: LatestChatterCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!chatters || chatters.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % chatters.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [chatters]);

  useEffect(() => {
    if (currentIndex >= chatters.length) setCurrentIndex(0);
  }, [chatters.length, currentIndex]);

  if (!chatters || chatters.length === 0) return null;

  const current = chatters[currentIndex] ?? chatters[0];
  const dateText = current.formattedDate || formatShortDate(current.date);
  const heading = current.title || current.mood || "碎碎念";

  return (
    <div className="group relative flex h-full min-h-[220px] w-full flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/40 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-800/50">
      <Link href={current.href || "/moments"} className="absolute inset-0 z-20" aria-label={heading} />

      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id || currentIndex}
            variants={holoVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="h-full w-full"
          >
            {current.cover ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={current.cover}
                alt={heading}
                className="h-full w-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
              />
            ) : (
              <div className="relative h-full w-full bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(124,156,191,0.35),transparent_60%)]" />
                <span className="absolute right-6 top-2 font-serif text-[7rem] leading-none text-white/5 select-none">
                  &rdquo;
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
      </div>

      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-end p-6 md:p-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-400 backdrop-blur-sm">
            Records
          </span>
          {dateText ? <span className="font-mono text-[11px] text-slate-300">{dateText}</span> : null}
        </div>

        <h3 className="mb-3 line-clamp-1 text-2xl font-bold text-white transition-colors duration-300 group-hover:text-indigo-300">
          {heading}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-300">{current.description}</p>
      </div>

      {chatters.length > 1 ? (
        <div className="absolute bottom-5 right-6 z-30 flex gap-2">
          {chatters.map((chatter, index) => (
            <button
              key={chatter.id || `chatter-${index}`}
              type="button"
              aria-label={`切换到第 ${index + 1} 条`}
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
