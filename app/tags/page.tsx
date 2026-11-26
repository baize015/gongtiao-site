import type { Metadata } from "next";
import Link from "next/link";
import { getAllTags } from "@/lib/content";
import { tagSlug } from "@/lib/tag-slug";
import { PageHeader } from "@/components/ui/Section";
import { IconTag } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "标签",
  description: "宫迢站内所有标签，字号大小对应文章数量。",
};

export default function TagsPage() {
  const tags = getAllTags();
  const maxCount = Math.max(1, ...tags.map((item) => item.count));

  return (
    <div className="page-shell pb-16 sm:pb-24">
      <PageHeader
        kicker="TAGS"
        title="标签"
        description={`共 ${tags.length} 个标签。字号大小，就是写过多少。`}
      />

      {tags.length > 0 ? (
        <div className="fade-up glass rounded-[1.25rem] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2.5">
            {tags.map(({ tag, count }) => {
              // 按数量在 0.75rem ~ 1rem 之间微调字号
              const ratio = count / maxCount;
              return (
                <Link
                  key={tag}
                  href={`/tags/${tagSlug(tag)}`}
                  className="chip"
                  style={{
                    fontSize: `${(0.75 + ratio * 0.25).toFixed(3)}rem`,
                    padding: `${(0.15 + ratio * 0.1).toFixed(3)}rem ${(0.6 + ratio * 0.28).toFixed(3)}rem`,
                  }}
                >
                  <IconTag size={12} className="opacity-60" />
                  {tag}
                  <span className="text-[0.8em] opacity-55">{count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="glass rounded-[1.25rem] px-6 py-10 text-center text-[0.9rem] text-[var(--ink-faint)]">
          还没有标签。
        </p>
      )}
    </div>
  );
}
