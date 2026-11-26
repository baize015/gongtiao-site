import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/site.config";
import { buildTimeline } from "@/lib/timeline";
import { getSocial } from "@/lib/site";
import { SectionTitle } from "@/components/ui/Section";
import { IconBilibili, IconGithub, IconMail, IconRss } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "关于",
  description: `关于 ${siteConfig.authorName}，以及「${siteConfig.title}」这个小站是怎么搭起来的。`,
};

const social = getSocial();

type SocialEntry = {
  key: string;
  label: string;
  value: string;
  href?: string;
  Icon: typeof IconGithub;
};

/* 空的社交项会在渲染时自动隐藏 */
const socialEntries: SocialEntry[] = [
  {
    key: "github",
    label: "GitHub",
    value: social.github,
    href: `https://github.com/${social.github}`,
    Icon: IconGithub,
  },
  {
    key: "bilibili",
    label: "哔哩哔哩",
    value: social.bilibili,
    href: `https://space.bilibili.com/${social.bilibili}`,
    Icon: IconBilibili,
  },
  {
    key: "email",
    label: "邮箱",
    value: social.email,
    href: `mailto:${social.email}`,
    Icon: IconMail,
  },
  {
    key: "qq",
    label: "QQ",
    value: social.qq,
    href: `https://wpa.qq.com/msgrd?v=3&uin=${social.qq}`,
    Icon: IconMail,
  },
  {
    key: "wechat",
    label: "微信",
    value: social.wechat,
    Icon: IconMail,
  },
  {
    key: "rss",
    label: "RSS",
    value: social.rss,
    href: social.rss,
    Icon: IconRss,
  },
].filter((entry) => entry.value.trim().length > 0);

const techStack = [
  { term: "框架", detail: "Next.js 16 App Router，整站在构建期预渲染成静态文件" },
  { term: "样式", detail: "Tailwind CSS 4，配一套雾蓝与暖白的设计令牌" },
  { term: "内容", detail: "文章与碎碎念都是 Markdown 文件，没有数据库，也没有后台" },
  { term: "交互", detail: "React 19，客户端只负责真正需要动的那几处" },
  { term: "山", detail: "灵境页面没有 three.js，山是 CSS 与 SVG 一点点画出来的" },
  { term: "部署", detail: "推送到仓库后自动构建，站点只是静静地待在那里" },
];

/* 时间线在构建期由文章、碎碎念与开站日期自动拼出 */
const timeline = buildTimeline();

const timelineLabels: Record<(typeof timeline)[number]["kind"], string> = {
  site: "开站",
  post: "文章",
  moment: "碎碎念",
  note: "",
};

export default function AboutPage() {
  return (
    <div className="page-shell pb-24">
      {/* 头部：头像 / 名字 / 简介 */}
      <header className="fade-up pt-6 sm:pt-10">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-9">
          <div className="relative shrink-0">
            <span
              aria-hidden="true"
              className="absolute -inset-1.5 rounded-full bg-[color-mix(in_oklab,var(--warm)_28%,transparent)] blur-md"
            />
            <img
              src={siteConfig.avatarUrl}
              alt={`${siteConfig.authorName}的头像`}
              className="relative h-24 w-24 rounded-full border border-[var(--glass-border)] object-cover shadow-[var(--shadow)] sm:h-28 sm:w-28"
            />
          </div>

          <div className="min-w-0">
            <p className="kicker mb-2">ABOUT</p>
            <h1 className="font-serif text-[2rem] leading-tight tracking-tight sm:text-[2.5rem]">
              {siteConfig.authorName}
            </h1>
            <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
              {siteConfig.bio}
            </p>
          </div>
        </div>
      </header>

      {/* 我在这里 */}
      <section className="mt-14 sm:mt-16">
        <SectionTitle title="我在这里" hint="有人的地方，风会小一点。" />
        {socialEntries.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {socialEntries.map(({ key, label, value, href, Icon }) =>
              href ? (
                <a
                  key={key}
                  href={href}
                  target={key === "email" ? undefined : "_blank"}
                  rel={key === "email" ? undefined : "noopener noreferrer"}
                  className="group flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--glass)] px-4 py-2 text-[0.82rem] text-[var(--ink-soft)] transition-all hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_45%,transparent)] hover:text-[var(--accent-strong)]"
                >
                  <Icon size={16} className="text-[var(--ink-faint)] transition-colors group-hover:text-[var(--accent-strong)]" />
                  {label}
                </a>
              ) : (
                <span
                  key={key}
                  className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--glass)] px-4 py-2 text-[0.82rem] text-[var(--ink-soft)]"
                >
                  <Icon size={16} className="text-[var(--ink-faint)]" />
                  {label}
                  <span className="font-mono text-[0.75rem] text-[var(--ink-faint)]">{value}</span>
                </span>
              ),
            )}
          </div>
        ) : (
          <p className="text-[0.88rem] text-[var(--ink-faint)]">
            还没有留下任何联系方式。等哪天想说话了，会补上。
          </p>
        )}
      </section>

      {/* 关于这个站 */}
      <section className="mt-14 sm:mt-16">
        <SectionTitle title="关于这个站" hint="为什么是雾蓝，为什么没有后台。" />
        <div className="glass p-6 sm:p-8">
          <p className="max-w-2xl text-[0.9rem] leading-[1.95] text-[var(--ink-soft)]">
            这里是一个人的小站。文章、碎碎念、相册，还有一些没什么用但舍不得删的东西。
            全站没有数据库，也不打算有——写完一个 Markdown 文件，推上去，页面就更新了。
            慢一点没关系，反正雾散得也很慢。
          </p>
          <div className="divider-warm my-7 opacity-60" />
          <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {techStack.map((item) => (
              <li key={item.term} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-[0.62rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--warm)]"
                />
                <p className="text-[0.86rem] leading-relaxed text-[var(--ink-soft)]">
                  <span className="font-serif text-[var(--ink)]">{item.term}</span>
                  <span className="mx-2 text-[var(--ink-faint)]">·</span>
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 时间线 */}
      <section className="mt-14 sm:mt-16">
        <SectionTitle title="时间线" hint="几件不太重要、但想记住的事。" />
        <ol className="relative ml-1 space-y-6 border-l border-[var(--line)] pl-6 sm:pl-8">
          {timeline.map((item) => (
            <li key={item.key} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[1.68rem] top-[0.55rem] h-2 w-2 rounded-full border border-[var(--warm)] bg-[var(--bg-base)] sm:-left-[2.18rem]"
              />
              <p className="font-mono text-[0.72rem] tracking-wide text-[var(--ink-faint)]">
                {item.date}
                {timelineLabels[item.kind] ? (
                  <span className="ml-2.5 text-[0.62rem] tracking-[0.16em] opacity-70">
                    {timelineLabels[item.kind]}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="link-underline transition-colors hover:text-[var(--accent-strong)]"
                  >
                    {item.text}
                  </Link>
                ) : (
                  item.text
                )}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 一句签名 */}
      <div className="divider-warm my-14 opacity-70" />
      <p className="fade-up text-center font-serif text-[1.05rem] leading-loose text-[var(--ink-soft)] sm:text-[1.2rem]">
        「雾散之前，字先落地。」
      </p>
      <p className="mt-3 text-center text-[0.75rem] tracking-[0.2em] text-[var(--ink-faint)]">
        {siteConfig.authorName}
      </p>
      <p className="mt-6 text-center text-xs text-[var(--ink-faint)]">
        站内文章为原创；未另行指明的封面图来自{" "}
        <Link href="/credits" className="link-underline hover:text-[var(--accent-strong)]">
          无版权风险的公开图库
        </Link>
        ，详见「版权与声明」。
      </p>
    </div>
  );
}
