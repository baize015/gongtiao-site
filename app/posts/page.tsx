import type { Metadata } from "next";
import Link from "next/link";
import { getAllPostMeta, getAllTags } from "@/lib/content";
import { tagSlug } from "@/lib/tag-slug";
import { PageHeader } from "@/components/ui/Section";
import PostCard from "@/components/posts/PostCard";
import SearchBar from "@/components/xh/SearchBar";

export const metadata: Metadata = {
  title: "文章",
  description: "宫迢写下的全部文章：阅读笔记、山野随笔，以及一些没想明白的问题。",
};

export default function PostsPage() {
  const posts = getAllPostMeta();
  const tags = getAllTags();

  return (
    <div className="page-shell pb-16 sm:pb-24">
      <PageHeader
        kicker="WRITING"
        title="文章"
        description={`共 ${posts.length} 篇。不追热点，不日更，想到什么写什么。`}
      />

      {/* 搜索 */}
      <div className="fade-up mb-8">
        <SearchBar
          posts={posts.map((p) => ({
            slug: p.slug,
            title: p.title,
            description: p.description,
            tags: p.tags,
            date: p.date,
          }))}
          placeholder="搜标题、标签、日期…"
        />
      </div>

      {/* 标签筛选：静态链接到标签页 */}
      {tags.length > 0 ? (
        <div className="fade-up mb-8 flex flex-wrap items-center gap-2">
          <span className="kicker mr-1">标签</span>
          {tags.map(({ tag, count }) => (
            <Link key={tag} href={`/tags/${tagSlug(tag)}`} className="chip">
              {tag}
              <span className="text-[0.92em] opacity-55">{count}</span>
            </Link>
          ))}
          <Link
            href="/tags"
            className="link-underline ml-1 text-[0.78rem] text-[var(--ink-faint)]"
          >
            全部标签
          </Link>
        </div>
      ) : null}

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <PostCard key={post.slug} post={post} priority={index === 0} />
          ))}
        </div>
      ) : (
        <p className="glass rounded-[1.25rem] px-6 py-10 text-center text-[0.9rem] text-[var(--ink-faint)]">
          还没有文章，雾里再等等。
        </p>
      )}
    </div>
  );
}
