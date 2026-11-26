import type { ReactNode } from "react";
import Link from "next/link";
import { IconArrowRight } from "@/components/ui/Icons";

/** 页面顶部的大标题区 */
export function PageHeader({
  kicker,
  title,
  description,
  children,
}: {
  kicker?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="fade-up pt-6 pb-10 sm:pt-10 sm:pb-14">
      {kicker ? <p className="kicker mb-3">{kicker}</p> : null}
      <h1 className="font-serif text-[2rem] sm:text-[2.6rem] leading-[1.25] tracking-tight">{title}</h1>
      {description ? (
        <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">{description}</p>
      ) : null}
      {children}
    </header>
  );
}

/** 区块标题（带可选「更多」链接） */
export function SectionTitle({
  title,
  hint,
  more,
  moreLabel = "全部",
}: {
  title: string;
  hint?: string;
  more?: string;
  moreLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-serif text-[1.35rem] flex items-center gap-2.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--warm)] translate-y-[-2px]" />
          {title}
        </h2>
        {hint ? <p className="mt-1.5 text-[0.8rem] text-[var(--ink-faint)]">{hint}</p> : null}
      </div>
      {more ? (
        <Link
          href={more}
          className="group flex items-center gap-1 text-[0.8rem] text-[var(--ink-faint)] hover:text-[var(--accent-strong)] transition-colors whitespace-nowrap"
        >
          {moreLabel}
          <IconArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
