import type { Metadata } from "next";
import { getFriends } from "@/lib/friends";
import { siteConfig } from "@/site.config";
import { PageHeader, SectionTitle } from "@/components/ui/Section";
import { IconArrowRight } from "@/components/ui/Icons";
import CopyBlock from "./CopyBlock";

export const metadata: Metadata = {
  title: "友链",
  description: "一些同样在雾里写字的人，去他们那里走走。",
};

export default function FriendsPage() {
  const friends = getFriends();

  return (
    <div className="page-shell pb-24">
      <PageHeader
        kicker="FRIENDS"
        title="友链"
        description="一些同样在雾里写字的人。路过的时候，替我看一眼他们门口的花。"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {friends.map((friend) => {
          const reachable = /^https?:\/\//i.test(friend.url);
          const inner = (
            <>
              <span
                className="shrink-0 rounded-2xl p-[1px]"
                style={{
                  background: `linear-gradient(140deg, color-mix(in oklab, ${friend.color ?? "#e6d3b3"} 55%, transparent), transparent 70%)`,
                }}
              >
                <img
                  src={friend.avatar}
                  alt={`${friend.name}的头像`}
                  loading="lazy"
                  className="h-12 w-12 rounded-2xl border border-[var(--line)] object-cover"
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate font-serif text-[1.02rem] text-[var(--ink)] transition-colors group-hover:text-[var(--accent-strong)]">
                    {friend.name}
                  </span>
                  {reachable && (
                    <IconArrowRight
                      size={13}
                      className="shrink-0 -translate-x-1 text-[var(--ink-faint)] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                    />
                  )}
                </span>
                <span className="mt-1 block text-[0.82rem] leading-relaxed text-[var(--ink-soft)]">
                  {friend.desc}
                </span>
              </span>
            </>
          );

          const className = "glass glass-hover group flex items-start gap-4 p-5";

          return reachable ? (
            <a
              key={friend.name}
              href={friend.url}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {inner}
            </a>
          ) : (
            <div key={friend.name} className={className}>
              {inner}
            </div>
          );
        })}
      </div>

      <section className="mt-16 sm:mt-20">
        <SectionTitle title="申请友链" hint="不用写得很正式，合得来就好。" />

        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
          <div className="glass p-6 sm:p-7">
            <p className="text-[0.9rem] leading-[1.95] text-[var(--ink-soft)]">
              如果你也有一个小站，也愿意慢慢写一些东西，欢迎交换友链。
              把右侧的格式填好发给我就行——站点要能打开，内容要是自己写的。
            </p>
            <p className="mt-4 text-[0.82rem] leading-relaxed text-[var(--ink-faint)]">
              我会挑一个雾不太大的下午回复你。没有回音，大概是雾还没散。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="chip">原创小站</span>
              <span className="chip">内容可访问</span>
              <span className="chip">不急</span>
            </div>
          </div>

          <div>
            <CopyBlock text={siteConfig.friendApply.format} />
            <p className="mt-3 text-[0.78rem] leading-relaxed text-[var(--ink-faint)]">
              求交换时可附一句你的站点简介，我会原样放在上面的卡片里。
            </p>
          </div>
        </div>
      </section>

      <p className="mt-14 text-center text-[0.8rem] leading-loose text-[var(--ink-faint)]">
        {friends.length > 0 ? "以上是已经走过的门口。" : "还没有友链。第一个位置，留给第一个来敲门的人。"}
      </p>
    </div>
  );
}
