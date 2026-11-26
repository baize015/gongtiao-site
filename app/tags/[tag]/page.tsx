import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTags, getPostsByTag, getTagBySlug, getTagSlugMap } from "@/lib/content";
import { tagSlug } from "@/lib/tag-slug";
import { PageHeader } from "@/components/ui/Section";
import PostCard from "@/components/posts/PostCard";
import { IconArrowLeft } from "@/components/ui/Icons";

export const dynamicParams = false;

/**
 * 路径片段用拼音（随笔 → suibi），而不是直接拿中文当目录名。
 * 原因：EdgeOne「直接上传」不接受非 ASCII 文件名，静态导出会把标签变成中文目录。
 */
export async function generateStaticParams() {
  return [...getTagSlugMap().keys()].map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const slug = (await params).tag;
  const tag = getTagBySlug(slug);
  if (!tag) return { title: "标签不存在" };
  const posts = getPostsByTag(tag);
  return {
    title: `标签：${tag}`,
    description: `标签「${tag}」下的全部文章，共 ${posts.length} 篇。`,
    alternates: { canonical: `/tags/${slug}` },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const slug = (await params).tag;
  const tag = getTagBySlug(slug);
  if (!tag) notFound();

  const posts = getPostsByTag(tag);
  if (posts.length === 0) notFound();

  const others = getAllTags().filter(({ tag: t }) => t !== tag).slice(0, 8);

  return (
    <div className="page-shell pb-16 sm:pb-24">
      <PageHeader
        kicker="TAG"
        title={`标签：${tag}`}
        description={`共 ${posts.length} 篇文章。`}
      >
        <Link href="/tags" className="btn-ghost mt-6 text-[0.8rem]">
          <IconArrowLeft size={14} />
          全部标签
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <PostCard key={post.slug} post={post} priority={index === 0} />
        ))}
      </div>

      {others.length > 0 ? (
        <div className="mt-12 flex flex-wrap items-center gap-2">
          <span className="kicker mr-1">换个标签</span>
          {others.map(({ tag: t }) => (
            <Link key={t} href={`/tags/${tagSlug(t)}`} className="chip">
              {t}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
