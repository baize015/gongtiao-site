"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { siteConfig } from "@/site.config";

const SEEN_KEY = "gongtiao-splash-at";
const AUTO_MS = 5200;

/**
 * 开屏：中间一条暖色细线，上下两片雾帘。
 * 往上滑、滚轮、点一下、按空格/回车/↑ 都能推开；滑多少开多少，松手不过阈值会弹回去。
 * 一个会话只放一次；地址后面加 ?splash=1 可以强制重看。
 */
export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const progress = useMotionValue(0);
  const drag = useRef({ startY: 0, active: false, lastY: 0, lastT: 0, velocity: 0 });
  const finished = useRef(false);
  const reduceMotion = useRef(false);

  const topY = useTransform(progress, [0, 1], ["0%", "-104%"]);
  const bottomY = useTransform(progress, [0, 1], ["0%", "104%"]);
  const seamOpacity = useTransform(progress, [0, 0.4], [1, 0]);
  const seamScale = useTransform(progress, [0, 1], [1, 0.4]);
  const bloomOpacity = useTransform(progress, [0, 0.5], [1, 0]);
  const bloomScale = useTransform(progress, [0, 1], [1, 1.7]);
  const contentY = useTransform(progress, [0, 1], [0, -120]);
  const contentOpacity = useTransform(progress, [0, 0.5], [1, 0]);
  const contentBlur = useTransform(progress, [0, 0.55], [0, 12]);
  const contentFilter = useTransform(contentBlur, (v) => `blur(${v}px)`);
  const hintOpacity = useTransform(progress, [0, 0.25], [1, 0]);
  const trackScale = useTransform(progress, [0, 1], [0.06, 1]);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setClosing(true);

    const done = () => {
      try {
        sessionStorage.setItem(SEEN_KEY, String(Date.now()));
      } catch {
        /* 隐私模式下 sessionStorage 可能不可用，忽略即可 */
      }
      document.documentElement.classList.add("splash-seen");
      setOpen(false);
      setClosing(false);
    };

    if (reduceMotion.current) {
      animate(progress, 1, { duration: 0.24, ease: "linear" }).then(done);
      return;
    }
    animate(progress, 1, { duration: 0.62, ease: [0.62, 0.02, 0.2, 1] }).then(done);
  }, [progress]);

  const settle = useCallback(() => {
    if (finished.current) return;
    const p = progress.get();
    const fast = Math.abs(drag.current.velocity) > 0.55;
    if (p > 0.18 || fast) {
      finish();
      return;
    }
    animate(progress, 0, { duration: 0.38, ease: [0.33, 1, 0.68, 1] });
  }, [finish, progress]);

  useEffect(() => {
    setMounted(true);

    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(SEEN_KEY);
    } catch {
      stored = null;
    }
    const forced = new URLSearchParams(window.location.search).get("splash") === "1";
    if (stored && !forced) {
      document.documentElement.classList.add("splash-seen");
      return;
    }

    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setOpen(true);
  }, []);

  // 锁滚动只跟着 open 走：开屏结束后必须立刻放开，
  // 否则 body 会一直 overflow:hidden，整站滚轮失效。
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const auto = window.setTimeout(() => finish(), reduceMotion.current ? 1200 : AUTO_MS);

    const onKey = (event: KeyboardEvent) => {
      if (["Escape", "Enter", " ", "ArrowUp", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        finish();
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 2) return;
      const next = Math.min(1, Math.max(0, progress.get() + event.deltaY / (window.innerHeight * 0.7)));
      progress.set(next);
      if (next >= 0.98) {
        finish();
        return;
      }
      window.clearTimeout(wheelTimer.current);
      wheelTimer.current = window.setTimeout(settle, 160);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.clearTimeout(auto);
      window.clearTimeout(wheelTimer.current);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
    };
  }, [open, finish, progress, settle]);

  const wheelTimer = useRef(0);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (finished.current) return;
    drag.current = { startY: event.clientY, active: true, lastY: event.clientY, lastT: performance.now(), velocity: 0 };
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const dy = drag.current.startY - event.clientY;
    const now = performance.now();
    const dt = Math.max(1, now - drag.current.lastT);
    drag.current.velocity = (drag.current.lastY - event.clientY) / dt;
    drag.current.lastY = event.clientY;
    drag.current.lastT = now;
    progress.set(Math.min(1, Math.max(0, dy / (window.innerHeight * 0.55))));
  };

  const onPointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    settle();
  };

  const title = useMemo(() => Array.from(siteConfig.navTitle || siteConfig.title), []);

  if (!mounted || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[100000] overflow-hidden select-none"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="presentation"
    >
      {/* 上层雾帘 */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[calc(50%+1px)] overflow-hidden will-change-transform"
        style={{
          y: topY,
          background: "linear-gradient(to bottom, var(--bg-deep) 0%, var(--bg-base) 58%, var(--bg-tint) 100%)",
        }}
      >
        <FogBlob className="-left-24 top-6" size={420} delay={0} />
        <FogBlob className="right-[-10%] top-1/3" size={520} delay={2.4} />
        <FogBlob className="left-1/3 -top-16" size={300} delay={4.1} warm />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--bg-tint)] to-transparent" />
      </motion.div>

      {/* 下层雾帘 */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[calc(50%+1px)] overflow-hidden will-change-transform"
        style={{
          y: bottomY,
          background: "linear-gradient(to top, var(--bg-deep) 0%, var(--bg-base) 58%, var(--bg-tint) 100%)",
        }}
      >
        <FogBlob className="left-[-8%] bottom-4" size={460} delay={1.2} />
        <FogBlob className="right-1/4 bottom-1/4" size={340} delay={3.3} warm />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[var(--bg-tint)] to-transparent" />

        {/* 远山剪影：三层，越近越实 */}
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-[var(--accent)]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 120 L0 74 L104 46 L186 70 L296 24 L392 66 L508 14 L620 62 L728 36 L830 78 L946 30 L1050 70 L1156 40 L1200 82 L1200 120 Z"
            fill="currentColor"
            opacity="0.14"
          />
          <path
            d="M0 120 L0 88 L92 54 L168 78 L268 32 L356 74 L462 20 L572 70 L676 44 L770 86 L880 38 L980 78 L1084 46 L1200 90 L1200 120 Z"
            fill="currentColor"
            opacity="0.22"
          />
          <path
            d="M0 120 L0 104 L120 84 L220 100 L336 72 L448 98 L560 68 L678 96 L790 74 L902 100 L1018 78 L1130 102 L1200 92 L1200 120 Z"
            fill="currentColor"
            opacity="0.34"
          />
        </svg>
      </motion.div>

      {/* 中缝暖光：细线 + 光晕 + 两端小菱形 */}
      <motion.div
        className="pointer-events-none absolute inset-x-[10%] top-1/2 h-px will-change-transform"
        style={{
          opacity: seamOpacity,
          scaleX: seamScale,
          background:
            "linear-gradient(to right, transparent, var(--warm) 14%, var(--accent-strong) 50%, var(--warm) 86%, transparent)",
          boxShadow: "0 0 24px 2px color-mix(in oklab, var(--accent) 52%, transparent)",
        }}
      />
      <span className="absolute left-[10%] top-1/2 h-[6px] w-[6px] -translate-y-1/2 rotate-45 bg-[var(--warm)]" />
      <span className="absolute right-[10%] top-1/2 h-[6px] w-[6px] -translate-y-1/2 rotate-45 bg-[var(--warm)]" />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
        style={{
          opacity: bloomOpacity,
          scale: bloomScale,
          background: "radial-gradient(circle, color-mix(in oklab, var(--warm) 34%, transparent) 0%, transparent 68%)",
          filter: "blur(18px)",
        }}
      />

      {/* 内容 */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{ y: contentY, opacity: contentOpacity, filter: contentFilter }}
      >
        <div className="mb-4 flex items-baseline justify-center overflow-hidden pb-1">
          {title.map((char, index) => (
            <motion.span
              key={`${char}-${index}`}
              initial={{ y: "110%", opacity: 0, filter: "blur(6px)" }}
              animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5, delay: 0.04 + index * 0.045, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-[3.2rem] leading-none tracking-[0.24em] text-[var(--ink)] [text-shadow:0_0_30px_color-mix(in_oklab,var(--warm)_80%,transparent)] sm:text-[4.4rem]"
            >
              {char}
            </motion.span>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22, ease: "easeOut" }}
          className="text-[0.7rem] tracking-[0.48em] text-[var(--ink-faint)] uppercase"
        >
          {siteConfig.navAfter}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scaleX: 0.3 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.7, delay: 0.34, ease: "easeOut" }}
          className="mt-7 h-px w-20 origin-center"
          style={{ background: "linear-gradient(to right, transparent, var(--warm), transparent)" }}
        />

        <motion.div
          style={{ opacity: hintOpacity }}
          className="mt-8 flex flex-col items-center gap-2.5 text-[0.68rem] tracking-[0.3em] text-[var(--ink-faint)]"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: closing ? 0 : 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            向上滑动
          </motion.span>
          <motion.svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </motion.svg>

          {/* 跟手进度：滑多少，这条线就长多少 */}
          <div className="mt-1 h-px w-16 overflow-hidden rounded-full bg-[var(--line)]">
            <motion.div
              className="h-full origin-left bg-[var(--warm)]"
              style={{ scaleX: trackScale }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* 漂浮尘点：让静止画面有呼吸感 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {DUST.map((dot, index) => (
          <motion.span
            key={index}
            className="absolute rounded-full bg-[var(--accent-strong)]"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: dot.size,
              height: dot.size,
              opacity: dot.opacity,
              boxShadow: "0 0 7px rgba(120,150,185,0.75)",
            }}
            animate={{ y: [0, -dot.rise, 0], opacity: [dot.opacity, dot.opacity * 0.35, dot.opacity] }}
            transition={{ duration: dot.duration, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* 四角细括号 */}
      <div className="pointer-events-none absolute inset-5 sm:inset-8" aria-hidden="true">
        <Corners />
      </div>

      {/* 暗角 + 颗粒 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(20,34,48,0.18) 100%)" }}
      />
      <div className="site-grain pointer-events-none absolute inset-0 opacity-70" />
    </div>
  );
}

/* 固定坐标，避免随机数造成 SSR/CSR 不一致 */
const DUST = [
  { x: 18, y: 26, size: 3, opacity: 0.55, rise: 26, duration: 11, delay: 0 },
  { x: 27, y: 62, size: 2, opacity: 0.48, rise: 18, duration: 13, delay: 1.2 },
  { x: 36, y: 18, size: 2, opacity: 0.44, rise: 22, duration: 12, delay: 2.1 },
  { x: 44, y: 74, size: 3, opacity: 0.3, rise: 30, duration: 14, delay: 0.6 },
  { x: 52, y: 34, size: 2, opacity: 0.46, rise: 16, duration: 10, delay: 3.2 },
  { x: 58, y: 68, size: 2, opacity: 0.5, rise: 24, duration: 12.5, delay: 1.8 },
  { x: 66, y: 22, size: 3, opacity: 0.3, rise: 28, duration: 13.5, delay: 2.6 },
  { x: 73, y: 54, size: 2, opacity: 0.44, rise: 20, duration: 11.5, delay: 0.9 },
  { x: 81, y: 38, size: 2, opacity: 0.48, rise: 18, duration: 12.8, delay: 3.6 },
  { x: 88, y: 66, size: 3, opacity: 0.3, rise: 26, duration: 14.5, delay: 1.4 },
];

function Corners() {
  const base = "absolute h-6 w-6 border-[var(--warm)]/70";
  return (
    <>
      <span className={`${base} left-0 top-0 border-l border-t`} />
      <span className={`${base} right-0 top-0 border-r border-t`} />
      <span className={`${base} bottom-0 left-0 border-b border-l`} />
      <span className={`${base} bottom-0 right-0 border-b border-r`} />
    </>
  );
}

function FogBlob({
  className,
  size,
  delay,
  warm,
}: {
  className: string;
  size: number;
  delay: number;
  warm?: boolean;
}) {
  return (
    <motion.div
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(closest-side, ${warm ? "var(--fog-3)" : "var(--fog-1)"} 0%, transparent 72%)`,
        opacity: 0.62,
      }}
      animate={{ x: [0, 26, -14, 0], y: [0, -16, 10, 0], scale: [1, 1.08, 0.97, 1] }}
      transition={{ duration: 16, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
