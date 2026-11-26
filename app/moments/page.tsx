import type { Metadata } from "next";
import { formatDate, getMoments } from "@/lib/content";
import { renderLightMarkdown } from "@/lib/markdown";
import { PageHeader } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "碎碎念",
  description: "一些来不及写成文章的话，短的、散的，落在时间线上。",
};

export default function MomentsPage() {
  const moments = getMoments();

  return (
    <div className="page-shell pb-24">
      <PageHeader
        kicker="MOMENTS"
        title="碎碎念"
        description={
          moments.length > 0
            ? `一些来不及写成文章的话。这里一共 ${moments.length} 条，最新的在最上面。`
            : "一些来不及写成文章的话，短的、散的，会落在这里。"
        }
      />

      {moments.length === 0 ? (
        <div className="glass flex flex-col items-center gap-2 px-6 py-16 text-center">
          <p className="font-serif text-[1.05rem] text-[var(--ink-soft)]">雾还很浓，这里暂时什么也没有。</p>
          <p className="text-[0.85rem] text-[var(--ink-faint)]">等一句话落下来，就写在这儿。</p>
        </div>
      ) : (
        <div className="relative space-y-6 pl-8 before:absolute before:bottom-4 before:left-[7px] before:top-4 before:w-px before:bg-[var(--line)]">
          {moments.map((moment) => (
            <article key={moment.id} className="relative">
              {/* 时间线的圆点 */}
              <span
                aria-hidden="true"
                className="absolute -left-[25px] top-[1.75rem] h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-[var(--warm)] bg-[var(--bg-base)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--warm)_16%,transparent)]"
              />

              <div className="glass glass-hover p-5 sm:p-6">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <time className="font-mono text-[0.72rem] tracking-wide text-[var(--ink-faint)]">
                    {formatDate(moment.date, "short")}
                  </time>
                  {moment.mood ? <span className="chip">{moment.mood}</span> : null}
                </div>

                <div
                  className="text-[0.92rem] leading-[1.95] text-[var(--ink-soft)] [&_p+p]:mt-3"
                  dangerouslySetInnerHTML={{ __html: renderLightMarkdown(moment.content) }}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
