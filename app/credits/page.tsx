import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/site.config";
import { getCovers } from "@/lib/covers";
import { PageHeader, SectionTitle } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "版权与声明",
  description: "宫迢小站的文章、图片来源与免责声明。",
};

export default function CreditsPage() {
  const covers = getCovers();
  const email = (siteConfig.social as unknown as Record<string, string>).email;

  return (
    <div className="page-shell pb-24">
      <PageHeader
        kicker="CREDITS"
        title="版权与声明"
        description="这个小站是什么、用了什么、哪些东西不属于我。"
      />

      <section className="mt-10 space-y-5 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
        <div className="glass rounded-2xl p-6">
          <SectionTitle title="本站性质" />
          <p>
            「{siteConfig.title}」是一个非商业的个人站点，不销售任何内容、不投放广告、不收集个人信息。
            站内文章均为 {siteConfig.authorName} 原创，除非另行注明。
          </p>
        </div>

        <div className="glass rounded-2xl p-6">
          <SectionTitle title="图片来源" />
          <p>
            文章没有手动指定封面时，会从下面这组风景图里按文章名稳定挑选一张。所有图片均来自
            Wikimedia Commons，许可证为 CC0、Public Domain 或 CC BY / CC BY-SA，不存在未经授权的商用素材。
            感谢每一位创作者。
          </p>
          {covers.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {covers.map((cover) => (
                <li key={cover.src} className="flex gap-4 items-start">
                  <img
                    src={cover.src}
                    alt={cover.title || "封面图"}
                    className="h-16 w-24 shrink-0 rounded-lg border border-[var(--line)] object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 text-[0.85rem]">
                    <p className="font-medium text-[var(--ink)]">
                      {cover.source ? (
                        <a href={cover.source} target="_blank" rel="noopener noreferrer" className="link-underline hover:text-[var(--accent-strong)]">
                          {cover.title || "未命名作品"}
                        </a>
                      ) : (
                        cover.title || "未命名作品"
                      )}
                    </p>
                    <p className="mt-0.5 text-[var(--ink-faint)]">
                      作者：{cover.author || "未注明"}
                      <span className="mx-1.5 opacity-40">·</span>
                      许可：
                      {cover.licenseUrl ? (
                        <a href={cover.licenseUrl} target="_blank" rel="noopener noreferrer" className="link-underline hover:text-[var(--accent-strong)]">
                          {cover.license || "见来源页"}
                        </a>
                      ) : (
                        cover.license || "见来源页"
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[var(--ink-faint)]">封面图池还没有配置。</p>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <SectionTitle title="免责声明" />
          <ul className="list-disc space-y-2 pl-5">
            <li>本站内容仅代表作者个人观点，不构成任何专业建议。</li>
            <li>第三方链接（友链、引用的作品页）的内容由其各自站点负责。</li>
            <li>
              如认为本站使用的任何文字或图片侵犯了您的权益，请通过
              {email ? (
                <>
                  <a href={`mailto:${email}`} className="link-underline hover:text-[var(--accent-strong)]">
                    邮箱
                  </a>
                </>
              ) : (
                "页脚邮箱"
              )}
              联系，核实后会第一时间撤下或替换。
            </li>
            <li>
              模板致谢：本站视觉与结构参考{" "}
              <a
                href="https://github.com/heiehiehi/XinghuisamaBlogs"
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline hover:text-[var(--accent-strong)]"
              >
                heiehiehi/XinghuisamaBlogs
              </a>
              （CC BY-NC 4.0），感谢原作者。
            </li>
          </ul>
        </div>

        <p className="pt-2 text-xs text-[var(--ink-faint)]">
          <Link href="/" className="link-underline hover:text-[var(--accent-strong)]">
            ← 回到首页
          </Link>
        </p>
      </section>
    </div>
  );
}
