import fs from "node:fs";
import path from "node:path";

export type CoverCredit = {
  src: string;
  title: string;
  author: string;
  source: string;
  license: string;
  licenseUrl: string;
};

const COVERS_FILE = path.join(process.cwd(), "content", "covers.json");

/** 读取无版权风景封面池；文件缺失或损坏时返回空数组 */
export function getCovers(): CoverCredit[] {
  let raw: string;
  try {
    raw = fs.readFileSync(COVERS_FILE, "utf8");
  } catch {
    return [];
  }
  try {
    const data = JSON.parse(raw) as { covers?: unknown };
    if (!Array.isArray(data.covers)) return [];
    return data.covers
      .map((item) => item as Partial<CoverCredit>)
      .filter((item): item is CoverCredit => typeof item?.src === "string" && item.src.trim().length > 0)
      .map((item) => ({
        src: item.src.trim(),
        title: String(item.title ?? "").trim(),
        author: String(item.author ?? "").trim(),
        source: String(item.source ?? "").trim(),
        license: String(item.license ?? "").trim(),
        licenseUrl: String(item.licenseUrl ?? "").trim(),
      }));
  } catch (error) {
    console.warn(`[gongtiao] content/covers.json 解析失败：${(error as Error).message}`);
    return [];
  }
}

/**
 * 给没有指定封面的文章挑一张：用 slug 做哈希，
 * 同一篇文章每次构建都拿到同一张图，不会来回跳。
 */
export function pickCover(slug: string): string {
  const covers = getCovers();
  if (covers.length === 0) return "";
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) % 1000003;
  }
  return covers[hash % covers.length].src;
}
