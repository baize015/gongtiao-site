import { siteConfig } from "@/site.config";
import { formatDate, getAllPostMeta, getMoments, parseDate } from "./content";

/** 时间线条目：开站 / 文章 / 碎碎念 / 兜底的一句话 */
export type TimelineKind = "site" | "post" | "moment" | "note";

export type TimelineItem = {
  key: string;
  kind: TimelineKind;
  date: string;
  sort: number;
  text: string;
  href?: string;
};

/** 时间线最多展示的近期条目数 */
const POST_LIMIT = 8;
const MOMENT_LIMIT = 3;

/** 把碎碎念压成一行短句：去掉代码块、链接与 markdown 记号 */
function plainSnippet(text: string): string {
  const plain = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 42 ? `${plain.slice(0, 42)}…` : plain;
}

/**
 * 由真实内容生成关于页时间线：
 * 开站日期 + 最近文章 + 近期碎碎念，最新的排在最上面。
 * 没有任何内容时只留开站与一句收尾，避免出现空的列表。
 */
export function buildTimeline(): TimelineItem[] {
  const items: TimelineItem[] = [];

  // 1. 开站：来自 siteConfig.buildDate
  const buildTime = parseDate(siteConfig.buildDate).getTime();
  items.push({
    key: "site:opening",
    kind: "site",
    date: formatDate(siteConfig.buildDate, "short") || siteConfig.buildDate || "开站那天",
    sort: buildTime > 0 ? buildTime : 0,
    text: `「${siteConfig.title}」开站，第一块路牌立起来。`,
  });

  // 2. 最近的文章，每篇一条
  const posts = getAllPostMeta().slice(0, POST_LIMIT);
  for (const post of posts) {
    items.push({
      key: `post:${post.slug}`,
      kind: "post",
      date: formatDate(post.date, "short") || "某天",
      sort: parseDate(post.date).getTime(),
      text: `写下《${post.title}》`,
      href: `/posts/${post.slug}`,
    });
  }

  // 3. 近期的碎碎念，只取短句，链回碎碎念页
  const moments = getMoments().slice(0, MOMENT_LIMIT);
  for (const moment of moments) {
    const snippet = plainSnippet(moment.content);
    if (!snippet) continue;
    items.push({
      key: `moment:${moment.id}`,
      kind: "moment",
      date: formatDate(moment.date, "short") || "某天",
      sort: parseDate(moment.date).getTime(),
      text: `碎碎念：${snippet}`,
      href: "/moments",
    });
  }

  // 4. 空站时留一句收尾
  if (posts.length === 0 && moments.length === 0) {
    items.push({
      key: "note:calm",
      kind: "note",
      date: "此刻",
      sort: 0,
      text: "雾还没散，路也还在往前。这里就先这样，慢慢添东西。",
    });
  }

  // 倒序：最新的在最上面
  return items.sort((a, b) => b.sort - a.sort);
}
