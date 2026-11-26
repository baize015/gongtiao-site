import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatDate,
  getAdjacentPosts,
  getAllPostMeta,
  getPost,
  parseDate,
} from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { tagSlug } from "@/lib/tag-slug";
import Comments from "@/components/site/Comments";
import ClientTOC from "@/components/xh/ClientTOC";
import SidebarLyric from "@/components/xh/SidebarLyric";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconClock,
  IconTag,
} from "@/components/ui/Icons";

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllPostMeta().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "文章不存在" };

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `/posts/${post.slug}`,
      images: post.cover ? [{ url: post.cover, alt: post.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const html = await renderMarkdown(post.markdown);
  const { prev, next } = getAdjacentPosts(post.slug);

  return (
    <article className="page-shell pb-16 sm:pb-24">
      <div className="fade-up pt-4">
        <Link
          href="/posts"
          className="inline-flex items-center gap-1.5 text-[0.82rem] text-[var(--ink-faint)] transition-colors hover:text-[var(--accent-strong)]"
        >
          <IconArrowLeft size={14} />
          返回文章
        </Link>
      </div>

      <header className="fade-up mx-auto mt-8 max-w-[760px]">
        <h1 className="font-serif text-[1.75rem] leading-[1.3] tracking-tight sm:text-[2.25rem]">
          {post.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.78rem] text-[var(--ink-faint)]">
          <span className="inline-flex items-center gap-1.5">
            <IconCalendar size={14} />
            <time dateTime={parseDate(post.date).toISOString()}>{formatDate(post.date)}</time>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconClock size={14} />阅读约 {post.readingMinutes} 分钟
          </span>
          {post.tags.length > 0 ? (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <IconTag size={14} />
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${tagSlug(tag)}`}
                  className="chip"
                >
                  {tag}
                </Link>
              ))}
            </span>
          ) : null}
        </div>

        {post.description ? (
          <p className="mt-5 border-l-2 border-[var(--warm)] pl-4 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
            {post.description}
          </p>
        ) : null}
      </header>

      {/* 封面大图 */}
      {post.cover ? (
        <div className="fade-up glass mx-auto mt-9 max-w-[920px] overflow-hidden rounded-[1.4rem] p-1.5 sm:p-2">
          <div className="relative aspect-[16/8] w-full overflow-hidden rounded-[1rem]">
            <Image
              src={post.cover}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 920px"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}

      {/* 正文 */}
      <div className="mx-auto mt-11 max-w-[760px]">
        <div className="prose-gt" dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {/* 上一篇 / 下一篇 */}
      {prev || next ? (
        <nav className="mx-auto mt-16 max-w-[760px]" aria-label="相邻文章">
          <div className="divider-warm mb-6" />
          <div className="grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/posts/${prev.slug}`}
                className="glass glass-hover group flex flex-col gap-1.5 rounded-[1.1rem] p-4"
              >
                <span className="inline-flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                  <IconArrowLeft size={12} />
                  更早一篇
                </span>
                <p className="font-serif text-[0.95rem] leading-snug text-[var(--ink-soft)] transition-colors group-hover:text-[var(--accent-strong)]">
                  {prev.title}
                </p>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}

            {next ? (
              <Link
                href={`/posts/${next.slug}`}
                className="glass glass-hover group flex flex-col gap-1.5 rounded-[1.1rem] p-4 sm:items-end sm:text-right"
              >
                <span className="inline-flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                  更新一篇
                  <IconArrowRight size={12} />
                </span>
                <p className="font-serif text-[0.95rem] leading-snug text-[var(--ink-soft)] transition-colors group-hover:text-[var(--accent-strong)]">
                  {next.title}
                </p>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}
          </div>
        </nav>
      ) : null}

      {/* 评论 */}
      <div className="mx-auto max-w-[760px]">
        <Comments />
      </div>

      {/* 右侧目录 + 正在播放（大屏才出现） */}
      <aside className="fixed right-6 top-32 hidden w-60 space-y-4 2xl:block">
        <ClientTOC />
        <SidebarLyric />
      </aside>
    </article>
  );
}
