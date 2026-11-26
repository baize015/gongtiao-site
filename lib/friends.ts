import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Friend = {
  name: string;
  desc: string;
  url: string;
  avatar: string;
  color?: string;
};

const FILE = join(process.cwd(), "content", "friends.json");

/** 读友链。文件坏了或不存在就当没有，页面会显示空态。 */
export function getFriends(): Friend[] {
  if (!existsSync(FILE)) return [];
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as { friends?: unknown };
    if (!Array.isArray(parsed.friends)) return [];
    return parsed.friends
      .map((entry) => {
        const item = entry as Record<string, unknown>;
        return {
          name: String(item.name ?? "").trim(),
          desc: String(item.desc ?? "").trim(),
          url: String(item.url ?? "").trim(),
          avatar: String(item.avatar ?? "").trim() || "/images/friends/f1.svg",
          ...(item.color ? { color: String(item.color) } : {}),
        };
      })
      .filter((friend) => friend.name);
  } catch (error) {
    console.warn(`[gongtiao] content/friends.json 解析失败：${String(error)}`);
    return [];
  }
}
