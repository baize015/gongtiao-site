import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";

/**
 * Markdown -> HTML。
 * - 支持 GFM（表格、任务列表、删除线、脚注）与 $公式$
 * - 代码块用 highlight.js 上色（配色在 globals.css 里自定义）
 * - 标题自动加 id，方便锚点跳转
 */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSlug)
  .use(rehypeHighlight, { detect: true, ignoreMissing: true })
  .use(rehypeKatex)
  .use(rehypeStringify);

function decorate(html: string): string {
  return (
    html
      // 外链新窗口打开
      .replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"')
      // 图片懒加载
      .replace(/<img /g, '<img loading="lazy" decoding="async" ')
  );
}

export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await processor.process(markdown);
  return decorate(String(file));
}

/** 给碎碎念这种短文本用，只做最小处理（换行 -> 段落） */
export function renderLightMarkdown(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
    .join("");
}
