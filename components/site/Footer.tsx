import Link from "next/link";
import { siteConfig } from "@/site.config";
import { getSocial } from "@/lib/site";
import { IconBilibili, IconGithub, IconMail, IconRss } from "@/components/ui/Icons";

const socialItems = [
  { key: "github", href: (v: string) => `https://github.com/${v}`, Icon: IconGithub, label: "GitHub" },
  { key: "bilibili", href: (v: string) => `https://space.bilibili.com/${v}`, Icon: IconBilibili, label: "B站" },
  { key: "email", href: (v: string) => `mailto:${v}`, Icon: IconMail, label: "邮箱" },
  { key: "rss", href: (v: string) => v, Icon: IconRss, label: "RSS" },
] as const;

export default function Footer() {
  const year = new Date().getFullYear();
  const social = getSocial() as unknown as Record<string, string>;
  const links = socialItems.filter((item) => Boolean(social[item.key]));

  return (
    <footer className="mt-24 pb-10">
      <div className="page-shell">
        <div className="divider-warm mb-8 opacity-70" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="font-serif text-[1.05rem] text-[var(--ink)]">
              {siteConfig.navTitle}
              <span className="text-[var(--ink-faint)]">{siteConfig.navSuffix}</span>
              {siteConfig.navAfter}
            </p>
            <p className="text-sm text-[var(--ink-faint)] max-w-md leading-relaxed">{siteConfig.bio}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {links.map(({ key, href, Icon, label }) => (
              <a
                key={key}
                href={href(social[key])}
                target={key === "email" ? undefined : "_blank"}
                rel="noopener noreferrer"
                aria-label={label}
                className="grid place-items-center w-9 h-9 rounded-full border border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--accent-strong)] hover:border-[color-mix(in_oklab,var(--accent)_45%,transparent)] transition-all"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-[var(--ink-faint)]">
          <p>
            © {siteConfig.footer.since}–{year} {siteConfig.footer.copyright || siteConfig.authorName}
            <span className="mx-2 opacity-40">·</span>
            雾散之前，字先落地
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {siteConfig.footer.badges.map((badge) => (
              <span key={badge} className="chip">
                {badge}
              </span>
            ))}
            {siteConfig.footer.icp ? (
              <a
                href={siteConfig.footer.icp.link}
                target="_blank"
                rel="noopener noreferrer"
                className="chip hover:text-[var(--accent-strong)]"
              >
                {siteConfig.footer.icp.name}
              </a>
            ) : null}
            <Link href="/rss.xml" className="chip">
              RSS
            </Link>
            <Link href="/credits" className="chip">
              版权与声明
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
