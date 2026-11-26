import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { siteConfig } from "@/site.config";

/**
 * 联系方式 / 社交账号。
 *
 * 真实值放在 `content/social.json`（在「管理端.cmd」→「设置」里填），
 * site.config.ts 里的 social 只当兜底默认值。
 * 这样改邮箱不用碰代码，也不会把配置写死进组件。
 */

export type Social = {
  email: string;
  qq: string;
  wechat: string;
  github: string;
  gitee: string;
  google: string;
  bilibili: string;
  rss: string;
};

const file = join(process.cwd(), "content", "social.json");

const defaults: Social = {
  email: "",
  qq: "",
  wechat: "",
  github: "",
  gitee: "",
  google: "",
  bilibili: "",
  rss: "/rss.xml",
  ...(siteConfig.social as Partial<Social>),
};

export function getSocial(): Social {
  if (!existsSync(file)) return defaults;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<Social>;
    const merged = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof Social)[]) {
      const value = parsed[key];
      if (typeof value === "string" && value.trim()) merged[key] = value.trim();
    }
    return merged;
  } catch (error) {
    console.warn(`[gongtiao] content/social.json 解析失败，用 site.config.ts 的默认值：${String(error)}`);
    return defaults;
  }
}
