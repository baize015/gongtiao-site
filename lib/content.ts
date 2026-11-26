import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { buildTagSlugMap } from "./tag-slug";
import { pickCover } from "./covers";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "content", "posts");
const MOMENTS_DIR = path.join(ROOT, "content", "moments");
const DAILY_DIR = path.join(ROOT, "content", "daily");

const isProd = process.env.NODE_ENV === "production";

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
  cover: string;
  tags: string[];
  draft: boolean;
  readingMinutes: number;
  words: number;
};

export type Post = PostMeta & { markdown: string };

export type Moment = {
  id: string;
  date: string;
  content: string;
  mood: string;
};

/* ------------------------------------------------------------------ */
/*  工具                                                               */
/* ------------------------------------------------------------------ */

export function parseDate(value: unknown): Date {
  if (value instanceof Date) return value;
  const str = String(value ?? "").trim();
  if (!str) return new Date(0);
  const normalized = str.replace(" ", "T");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

export function formatDate(value: unknown, style: "full" | "short" | "month" | "day" = "full"): string {
  const d = parseDate(value);
  if (d.getTime() === 0) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (style === "short") return `${y}.${m}.${day}`;
  if (style === "month") return `${y}.${m}`;
  if (style === "day") return `${m}.${day}`;
  return `${y} 年 ${m} 月 ${day} 日`;
}

function readDirSafe(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

/** 中英混排的字数统计 + 阅读时长（中文 350 字/分，英文 200 词/分） */
function measure(text: string): { words: number; readingMinutes: number } {
  const cjk = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
  const latin = (text.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, " ").match(/[A-Za-z0-9_]+/g) || []).length;
  const words = cjk + latin;
  return { words, readingMinutes: Math.max(1, Math.round(cjk / 350 + latin / 200)) };
}

/**
 * 用文件名生成 URL 短名：
 *   2026-11-18-hello.md  → hello
 *   hello.md             → hello
 * 日期前缀（YYYY-MM-DD-）只是给文件排序看的，不进 URL。
 */
function slugFromFile(file: string): string {
  return file
    .replace(/\.mdx?$/, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

/* ------------------------------------------------------------------ */
/*  文章                                                               */
/* ------------------------------------------------------------------ */

function readPost(file: string): Post | null {
  const full = path.join(POSTS_DIR, file);
  let raw: string;
  try {
    raw = fs.readFileSync(full, "utf8");
  } catch {
    return null;
  }
  const { data, content } = matter(raw);
  const slug = typeof data.slug === "string" && data.slug.trim() ? data.slug.trim() : slugFromFile(file);
  const measureResult = measure(content);
  const declaredCover = String(data.cover ?? "").trim();
  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? ""),
    description: String(data.description ?? ""),
    // 没写封面就从风景图池里按 slug 稳定挑一张
    cover: declaredCover || pickCover(slug),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    draft: data.draft === true,
    readingMinutes: measureResult.readingMinutes,
    words: measureResult.words,
    markdown: content,
  };
}

/** 全部文章（不含草稿），按日期倒序 */
export function getAllPosts(): Post[] {
  const posts = readDirSafe(POSTS_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map(readPost)
    .filter((p): p is Post => Boolean(p))
    .filter((p) => !(isProd && p.draft));
  // 两个文件名去掉日期前缀后撞名时给个提示，避免文章互相覆盖
  const seen = new Set<string>();
  for (const post of posts) {
    if (seen.has(post.slug)) {
      console.warn(`[gongtiao] 有重复的文章短名：${post.slug}，请修改文件名或在 frontmatter 里指定 slug`);
    }
    seen.add(post.slug);
  }
  return posts.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
}

export function getAllPostMeta(): PostMeta[] {
  return getAllPosts().map(({ markdown: _markdown, ...meta }) => meta);
}

export function getPost(slug: string): Post | null {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}

export function getAdjacentPosts(slug: string): { prev: PostMeta | null; next: PostMeta | null } {
  const meta = getAllPostMeta();
  const index = meta.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: meta[index + 1] ?? null, // 更早的一篇
    next: meta[index - 1] ?? null, // 更新的一篇
  };
}

export function getAllTags(): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) map.set(tag, (map.get(tag) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "zh-CN"));
}

export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPostMeta().filter((p) => p.tags.includes(tag));
}

/** slug → 原标签 的映射（用于 /tags/[slug] 反查，保证静态导出后目录名是纯 ASCII） */
export function getTagSlugMap(): Map<string, string> {
  return buildTagSlugMap(getAllTags().map(({ tag }) => tag));
}

export function getTagBySlug(slug: string): string | undefined {
  return getTagSlugMap().get(slug);
}

export function getArchive(): { year: string; posts: PostMeta[] }[] {
  const groups = new Map<string, PostMeta[]>();
  for (const post of getAllPostMeta()) {
    const year = String(parseDate(post.date).getFullYear() || "未知");
    groups.set(year, [...(groups.get(year) ?? []), post]);
  }
  return [...groups.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, posts]) => ({ year, posts }));
}

/* ------------------------------------------------------------------ */
/*  碎碎念                                                             */
/* ------------------------------------------------------------------ */

export function getMoments(): Moment[] {
  return readDirSafe(MOMENTS_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map((file) => {
      try {
        const raw = fs.readFileSync(path.join(MOMENTS_DIR, file), "utf8");
        const { data, content } = matter(raw);
        return {
          id: file.replace(/\.mdx?$/, ""),
          date: String(data.date ?? ""),
          content: content.trim(),
          mood: String(data.mood ?? ""),
        };
      } catch {
        return null;
      }
    })
    .filter((m): m is Moment => Boolean(m))
    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
}

/* ------------------------------------------------------------------ */
/*  每日选刊（可选，放 content/daily/YYYY-MM-DD.json）                  */
/* ------------------------------------------------------------------ */

export type DailyItem = { title: string; url: string; source?: string; note?: string };
export type DailyBriefing = { date: string; intro?: string; items: DailyItem[] };

export function getLatestDaily(): DailyBriefing | null {
  const files = readDirSafe(DAILY_DIR).filter((f) => f.endsWith(".json")).sort().reverse();
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(DAILY_DIR, file), "utf8"));
      if (data && Array.isArray(data.items)) {
        return { date: String(data.date ?? file.replace(/\.json$/, "")), intro: data.intro, items: data.items };
      }
    } catch {
      /* ignore broken file */
    }
  }
  return null;
}
