import Link from "next/link";
import { siteConfig } from "@/site.config";
import { getAllPostMeta, getMoments } from "@/lib/content";
import { countPhotos, getAlbums } from "@/lib/albums";
import { getSocial } from "@/lib/site";

import { IconArrowRight } from "@/components/ui/Icons";

/* 首页卡片矩阵：移植自原模板 heiehiehi/XinghuisamaBlogs 的 bento 布局 */
import SearchBar from "@/components/xh/SearchBar";
import AlbumPoster from "@/components/xh/AlbumPoster";
import ProfileCard from "@/components/xh/ProfileCard";
import CloudPlayer from "@/components/xh/CloudPlayer";
import LyricBar from "@/components/xh/LyricBar";
import LatestPostsCarousel from "@/components/xh/LatestPostsCarousel";
import LatestChatterCarousel from "@/components/xh/LatestChatterCarousel";
import ThemeToggleBlock from "@/components/xh/ThemeToggleBlock";
import SiteDashboard from "@/components/xh/SiteDashboard";

export const metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
};

export default function HomePage() {
  const posts = getAllPostMeta();
  const moments = getMoments();
  const albums = getAlbums();
  const photoCount = countPhotos(albums);
  const latestAlbum = albums[0];
  const social = getSocial();

  // 首页照片墙海报：所有相册里的照片都进轮换（相册顺序 → 照片顺序）
  const posterSlides = albums
    .flatMap((album) =>
      album.photos.map((photo) => ({
        src: photo.src,
        album: album.name,
        title: photo.title,
        desc: album.description,
      })),
    )
    .slice(0, 12);

  const searchPosts = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    tags: p.tags,
    date: p.date,
  }));

  const carouselPosts = posts.slice(0, 5).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    cover: p.cover,
    date: p.date,
    tags: p.tags,
  }));

  const chatters = moments.slice(0, 5).map((m) => ({
    id: m.id,
    href: "/moments",
    description: m.content,
    date: m.date,
    mood: m.mood,
  }));

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-10">
      {/* ---------------- 首屏标题 ---------------- */}
      <section className="pb-8 pt-4 sm:pb-10">
        <p className="kicker fade-up mb-5">A SMALL PLACE IN THE FOG</p>
        <h1 className="fade-up font-serif text-[2.1rem] leading-[1.2] tracking-tight sm:text-[3rem] sm:leading-[1.15]">
          {siteConfig.home.lines.map((line, i) => (
            <span key={line} className="block" style={{ animationDelay: `${i * 45}ms` }}>
              {line}
            </span>
          ))}
        </h1>
        <p
          className="fade-up mt-5 max-w-xl text-[0.92rem] leading-[1.9] text-[var(--ink-soft)]"
          style={{ animationDelay: "80ms" }}
        >
          {siteConfig.home.subtitle}
        </p>
        <div className="fade-up mt-7 flex flex-wrap items-center gap-3" style={{ animationDelay: "130ms" }}>
          <Link href="/posts" className="btn-ghost group">
            读点东西
            <IconArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link href="/about" className="btn-ghost">
            我是谁
          </Link>
        </div>
      </section>

      {/* ---------------- 搜索 ---------------- */}
      <SearchBar posts={searchPosts} placeholder="找找看：标题、标签、日期…" />

      {/* ---------------- 卡片矩阵 ---------------- */}
      <main className="mt-6 flex w-full flex-col gap-6">
        {/* 第一行：个人名片 + 电台 */}
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="col-span-1 flex flex-col lg:col-span-7">
            <ProfileCard
              postCount={posts.length}
              chatterCount={moments.length}
              photoCount={photoCount}
              social={social}
            />
          </div>
          <div className="col-span-1 flex flex-col lg:col-span-5">
            <CloudPlayer />
          </div>
        </div>

        {/* 歌词条：没在放歌时自己不渲染 */}
        <div className="-mt-2 w-full">
          <LyricBar />
        </div>

        {/* 第二行：文章轮播 + 照片墙 / 碎碎念 / 主题切换 */}
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="col-span-1 flex min-h-[300px] flex-col lg:col-span-4">
            <LatestPostsCarousel posts={carouselPosts} />
          </div>

          <div className="col-span-1 flex flex-col gap-6 lg:col-span-8">
            {/* 照片墙大海报：自动轮换相册里上传的照片 */}
            <AlbumPoster
              slides={posterSlides}
              fallbackName={latestAlbum?.name ?? "相册"}
              fallbackDesc={latestAlbum?.description || "山里、路上、窗边"}
            />

            {/* 底层网格：碎碎念 + 主题切换 */}
            <div className="grid w-full flex-1 grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="flex min-h-[200px] flex-col sm:col-span-2">
                <LatestChatterCarousel chatters={chatters} />
              </div>
              <div className="flex min-h-[120px] flex-col sm:col-span-1">
                <ThemeToggleBlock />
              </div>
            </div>
          </div>
        </div>

        {/* 底部数据面板 */}
        <div className="mt-4 w-full">
          <SiteDashboard />
        </div>
      </main>
    </div>
  );
}
