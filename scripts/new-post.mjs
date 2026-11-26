#!/usr/bin/env node
/**
 * 新建一篇文章：在 content/posts/ 下生成带 frontmatter 的 Markdown 骨架。
 *
 * 用法：
 *   npm run new                       # 交互式，按提示填
 *   npm run new -- "标题"             # 直接给标题，其余用默认值
 *   npm run new -- "标题" my-slug     # 再指定 URL 里的 slug
 */
import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const DEFAULT_COVER = "/images/covers/default.svg";

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function slugify(text) {
  const ascii = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || "";
}

function escapeQuotes(text) {
  return String(text).replace(/"/g, '\\"');
}

async function main() {
  let [title = "", slugArg = ""] = process.argv.slice(2);
  const interactive = !title;
  const rl = interactive
    ? createInterface({ input, output })
    : null;

  const ask = async (question, fallback = "") => {
    if (!rl) return fallback;
    const answer = (await rl.question(`${question}${fallback ? ` (${fallback})` : ""}: `)).trim();
    return answer || fallback;
  };

  if (interactive) {
    output.write("\n🐈  新建一篇文章\n\n");
    title = await ask("标题");
    if (!title) {
      output.write("标题不能为空。\n");
      rl.close();
      process.exit(1);
    }
  }

  const date = today();
  let slug = slugArg || slugify(title);
  if (!slug) {
    slug = await ask("URL 用的英文短名（可留空，会自动生成）", "");
    if (!slug) slug = `post-${Date.now().toString(36)}`;
  }
  slug = slugify(slug) || `post-${Date.now().toString(36)}`;

  const description = await ask("一句话简介（列表和分享卡片会用到）", title);
  const tagsRaw = await ask("标签，用逗号分隔", "");
  const cover = await ask("封面图片路径", DEFAULT_COVER);
  const draftAnswer = await ask("先存为草稿？只在本地可见 (y/N)", "N");

  const tags = tagsRaw
    .split(/[,，\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const tagsLine = tags.length
    ? `tags:\n${tags.map((t) => `  - ${t}`).join("\n")}`
    : "tags: []";

  const frontmatter = [
    "---",
    `title: "${escapeQuotes(title)}"`,
    `date: "${date}"`,
    `description: "${escapeQuotes(description)}"`,
    `cover: "${cover}"`,
    tagsLine,
    ...(/^y/i.test(draftAnswer) ? ["draft: true"] : []),
    "---",
    "",
    "在这里开始写作。支持 Markdown、代码块、表格、脚注和 `$数学公式$`。",
    "",
  ].join("\n");

  fs.mkdirSync(POSTS_DIR, { recursive: true });
  const fileName = `${date}-${slug}.md`;
  const filePath = path.join(POSTS_DIR, fileName);

  if (fs.existsSync(filePath)) {
    output.write(`\n文件已存在：${filePath}\n换个短名或者直接编辑它。\n`);
    rl?.close();
    process.exit(1);
  }

  fs.writeFileSync(filePath, frontmatter, "utf8");

  output.write(`\n✅ 已创建 content/posts/${fileName}\n`);
  output.write(`   写作地址：${filePath}\n`);
  output.write(`   预览：npm run dev  →  http://localhost:3000/posts/${slug}\n`);
  output.write(`   发布：git add . && git commit -m "posts: ${title}" && git push\n\n`);
  rl?.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
