import { pinyin } from "pinyin-pro";

/**
 * 标签 → URL 片段。
 *
 * 为什么不用中文直接当目录名：EdgeOne 的「直接上传」不接受非 ASCII 的文件名，
 * 静态导出后 /tags/随笔/ 会变成磁盘上一个中文目录，上传直接被拒。
 * 这里把中文转成拼音（随笔 → suibi），英文标签原样保留。
 */
export function tagSlug(tag: string): string {
  const raw = tag.trim();
  if (!raw) return "tag";

  // 纯英文/数字的标签：直接小写化 + 连字符
  if (/^[\x20-\x7E]+$/.test(raw)) {
    return slugify(raw) || "tag";
  }

  const py = pinyin(raw, { toneType: "none", type: "array", nonZh: "consecutive" })
    .join("-");

  return slugify(py) || "tag";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * 给一组标签建立「slug → 原标签」的映射。
 * 不同标签可能转出同一个 slug（比如「随笔」和「随笔」），这里按顺序加 -2、-3 兜底。
 */
export function buildTagSlugMap(tags: readonly string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const tag of tags) {
    const base = tagSlug(tag);
    let slug = base;
    let i = 2;
    while (map.has(slug)) {
      slug = `${base}-${i++}`;
    }
    map.set(slug, tag);
  }
  return map;
}
