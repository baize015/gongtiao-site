import Image from "next/image";
import Link from "next/link";
import type { PostMeta } from "@/lib/content";
import { formatDate } from "@/lib/content";
import { IconCalendar, IconClock, IconMountain } from "@/components/ui/Icons";

/**
 * 文章卡片：封面 + 日期 + 标题 + 简介（两行）+ 标签 + 阅读时长。
 * 整张卡片是一个链接，标签只用展示、不再嵌套链接。
 */
export default function PostCard({
  post,
  priority = false,
}: {
  post: PostMeta;
  priority?: boolean;
}) {
  return (
    <article className="h-full">
      <Link
        href={`/posts/${post.slug}`}
        className="group glass glass-hover flex h-full flex-col overflow-hidden rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {/* 封面 */}
        <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--accent)_9%,transparent)]">
          {post.cover ? (
            <Image
              src={post.cover}
              alt={post.title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04] active:scale-[0.99] active:duration-75"
            />
          ) : (
            <div className="grid h-full place-items-center text-[var(--ink-faint)]">
              <IconMountain size={34} />
            </div>
          )}
        </div>

        {/* 文字区 */}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.74rem] text-[var(--ink-faint)]">
            <span className="inline-flex items-center gap-1">
              <IconCalendar size={13} />
              {formatDate(post.date, "short")}
            </span>
            <span className="inline-flex items-center gap-1">
              <IconClock size={13} />
              {post.readingMinutes} 分钟
            </span>
          </div>

          <h3 className="mt-2.5 font-serif text-[1.1rem] leading-snug tracking-tight text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--accent-strong)]">
            {post.title}
          </h3>

          {post.description ? (
            <p className="mt-2 line-clamp-2 text-[0.86rem] leading-relaxed text-[var(--ink-soft)]">
              {post.description}
            </p>
          ) : null}

          {post.tags.length > 0 ? (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
              {post.tags.map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
