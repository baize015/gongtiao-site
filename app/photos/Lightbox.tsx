"use client";

import { useCallback, useEffect, useState } from "react";
import type { Photo } from "@/lib/albums";
import { IconArrowLeft, IconArrowRight, IconClose } from "@/components/ui/Icons";

/** 相册网格 + 灯箱：点击放大，Esc / 遮罩关闭，左右切换 */
export default function Lightbox({ photos, albumName }: { photos: Photo[]; albumName: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const current = openIndex === null ? null : photos[openIndex];

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (dir: number) => {
      setOpenIndex((i) => {
        if (i === null || photos.length === 0) return i;
        return (i + dir + photos.length) % photos.length;
      });
    },
    [photos.length],
  );

  useEffect(() => {
    if (openIndex === null) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    }

    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [openIndex, close, step]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, i) => (
          <button
            key={`${photo.src}-${i}`}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`查看大图：${photo.title ?? albumName}`}
            className="glass glass-hover group relative block overflow-hidden p-0 text-left"
          >
            <img
              src={photo.src}
              alt={photo.title ?? albumName}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] active:scale-[0.99] active:duration-75"
            />
            {photo.title ? (
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(12,20,28,0.6)] to-transparent px-4 pb-3 pt-10 text-[0.8rem] text-white">
                {photo.title}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {current ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,15,22,0.82)] p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${albumName}的大图`}
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="关闭"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white/80 transition-colors hover:text-white sm:right-6 sm:top-6"
          >
            <IconClose size={18} />
          </button>

          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="上一张"
                className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 text-white/75 transition-colors hover:text-white sm:left-5"
              >
                <IconArrowLeft size={18} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="下一张"
                className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 text-white/75 transition-colors hover:text-white sm:right-5"
              >
                <IconArrowRight size={18} />
              </button>
            </>
          ) : null}

          <figure className="max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={current.src}
              alt={current.title ?? albumName}
              className="max-h-[74vh] w-auto max-w-full rounded-xl object-contain shadow-[var(--shadow-lg)]"
            />
            {current.title || current.note ? (
              <figcaption className="mt-4 text-center">
                {current.title ? (
                  <p className="font-serif text-[0.98rem] text-white/90">{current.title}</p>
                ) : null}
                {current.note ? (
                  <p className="mt-1 text-[0.8rem] leading-relaxed text-white/60">{current.note}</p>
                ) : null}
              </figcaption>
            ) : null}
            <p className="mt-3 text-center font-mono text-[0.68rem] tracking-widest text-white/35">
              {(openIndex ?? 0) + 1} / {photos.length}
            </p>
          </figure>
        </div>
      ) : null}
    </>
  );
}
