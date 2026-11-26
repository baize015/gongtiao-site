import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, getArchive, parseDate } from "@/lib/content";
import { PageHeader } from "@/components/ui/Section";
import { IconArrowRight } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "归档",
  description: "宫迢的全部文章，按年份归档：走过的时间，写下的字。",
};

export default function ArchivePage() {
  const archive = getArchive();
  const total = archive.reduce((sum, group) => sum + group.posts.length, 0);

  return (
    <div className="page-shell pb-16 sm:pb-24">
      <PageHeader
        kicker="ARCHIVE"
        title="归档"
        description={`共 ${total} 篇，按年份排列。时间往前走，字留在原地。`}
      />

      {archive.length > 0 ? (
        <div className="space-y-10">
          {archive.map(({ year, posts }) => (
            <section key={year} className="fade-up">
              <div className="mb-3 flex items-center gap-3 px-1">
                <h2 className="font-serif text-[1.5rem] leading-none">{year}</h2>
                <span className="text-[0.78rem] text-[var(--ink-faint)]">{posts.length} 篇</span>
                <span className="ml-1 h-px flex-1 bg-[var(--line)]" />
              </div>

              <ul className="glass overflow-hidden rounded-[1.1rem]">
                {posts.map((post) => (
                  <li key={post.slug} className="border-b border-[var(--line)] last:border-b-0">
                    <Link
                      href={`/posts/${post.slug}`}
                      className="group flex items-center gap-4 px-4 py-3.5 transition-colors duration-300 hover:bg-[var(--glass-hover)] sm:px-5"
                    >
                      <time
                        dateTime={parseDate(post.date).toISOString()}
                        className="w-12 shrink-0 font-mono text-[0.78rem] tabular-nums text-[var(--ink-faint)]"
                      >
                        {formatDate(post.date, "day")}
                      </time>
                      <span className="flex-1 text-[0.92rem] leading-snug text-[var(--ink-soft)] transition-colors group-hover:text-[var(--accent-strong)]">
                        {post.title}
                      </span>
                      <IconArrowRight
                        size={14}
                        className="shrink-0 text-[var(--ink-faint)] opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="glass rounded-[1.25rem] px-6 py-10 text-center text-[0.9rem] text-[var(--ink-faint)]">
          这里还空着。
        </p>
      )}
    </div>
  );
}
