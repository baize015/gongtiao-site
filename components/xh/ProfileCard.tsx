"use client";

/**
 * ProfileCard —— 首页个人名片（移植自 XHBlogs/components/ProfileCard.tsx）
 *
 * 与原版的差异（只动接入层）：
 * 1. 不依赖原模板的 ToastProvider，复制反馈改为组件内部的小气泡；
 * 2. 社交项为空时不再渲染空按钮（本站 social 字段默认留空）；
 * 3. 点击整卡跳 /about，点击社交按钮不冒泡。
 *
 * 数据全部来自 siteConfig，计数由页面传入。
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/site.config";
import type { Social } from "@/lib/site";

export type ProfileCardProps = {
  /** 文章总数 */
  postCount: number;
  /** 碎碎念总数 */
  chatterCount: number;
  /** 相册照片总数 */
  photoCount: number;
  /** 联系方式（来自 content/social.json，由首页从服务端传进来） */
  social?: Partial<Social>;
};

export default function ProfileCard({ postCount, chatterCount, photoCount, social: socialProp }: ProfileCardProps) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    const done = () => setToast(`${label} 已复制：${text}`);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      done();
    }
  };

  const social = { ...(siteConfig.social ?? {}), ...(socialProp ?? {}) } as Record<string, string | undefined>;

  return (
    <div
      onClick={() => router.push("/about")}
      className="relative flex h-full min-h-[220px] w-full cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-white/40 bg-white/40 p-5 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] active:duration-75 group dark:border-white/10 dark:bg-slate-800/50 md:min-h-[280px] md:p-8"
    >
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex w-full items-center gap-4 md:gap-6">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-1 shadow-lg transition-transform duration-500 group-hover:rotate-3 sm:h-20 sm:w-20 md:h-24 md:w-24 md:rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={siteConfig.avatarUrl}
              alt={siteConfig.authorName}
              className="h-full w-full rounded-lg bg-white object-cover md:rounded-xl"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="mb-1 truncate pb-1 text-xl font-bold leading-snug tracking-wider text-slate-900 transition-colors duration-300 dark:text-white sm:text-2xl md:mb-2 md:text-3xl">
              {siteConfig.authorName}
            </h1>
            <p className="line-clamp-2 max-w-md text-xs font-medium leading-relaxed text-slate-700 transition-colors duration-300 dark:text-slate-300 sm:text-sm md:line-clamp-none md:text-base">
              {siteConfig.bio}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6 flex flex-col items-center justify-between gap-5 md:mt-8 md:flex-row md:items-end md:gap-6">
        <div className="flex w-full justify-between gap-2 px-2 sm:justify-around sm:gap-6 sm:px-0 md:w-auto md:justify-start">
          <StatItem count={postCount} label="文章" color="text-indigo-600 dark:text-indigo-400" />
          <div className="hidden h-8 w-px bg-slate-300/50 dark:bg-slate-700 md:block md:h-10" />
          <StatItem count={chatterCount} label="杂谈" color="text-purple-600 dark:text-purple-400" />
          <div className="hidden h-8 w-px bg-slate-300/50 dark:bg-slate-700 md:block md:h-10" />
          <StatItem count={photoCount} label="照片" color="text-pink-600 dark:text-pink-400" />
        </div>

        <div
          className="flex w-full flex-wrap justify-center gap-2 md:w-auto md:justify-end md:gap-3"
          onClick={(event) => event.stopPropagation()}
        >
          {/* 用户名会自动拼成完整链接；留空则整个按钮不渲染 */}
          <SocialBtn type="github" url={social.github ? `https://github.com/${social.github.replace(/^https?:\/\/(www\.)?github\.com\//, "")}` : undefined} />
          <SocialBtn type="gitee" url={social.gitee ? `https://gitee.com/${social.gitee.replace(/^https?:\/\/(www\.)?gitee\.com\//, "")}` : undefined} />
          <SocialBtn
            type="google"
            url={social.google ? (social.google.startsWith("http") ? social.google : `https://www.google.com/search?q=${encodeURIComponent(social.google)}`) : undefined}
          />
          {/* 邮箱直接唤起写信；QQ / 微信点一下复制（这两个没有通用链接协议） */}
          <SocialBtn type="email" url={social.email ? `mailto:${social.email}` : undefined} />
          <SocialBtn
            type="qq"
            onClick={social.qq ? () => copyToClipboard(social.qq ?? "", "QQ 号") : undefined}
          />
          <SocialBtn
            type="wechat"
            onClick={social.wechat ? () => copyToClipboard(social.wechat ?? "", "微信号") : undefined}
          />
        </div>
      </div>

      {toast ? (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/40 bg-slate-900/85 px-4 py-1.5 text-[0.75rem] font-medium text-white shadow-lg backdrop-blur-md">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function StatItem({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className="group/stat px-2 text-center">
      <div className={`text-xl font-black ${color} transition-transform group-hover/stat:scale-110 md:text-2xl`}>
        {count}
      </div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 md:text-[10px]">
        {label}
      </div>
    </div>
  );
}

function SocialBtn({ type, url, onClick }: { type: string; url?: string; onClick?: () => void }) {
  const getIcon = () => {
    switch (type) {
      case "github":
        return (
          <svg className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        );
      case "gitee":
        return (
          <svg className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482c0-.326.266-.592.592-.592h6.81c.328 0 .593.266.593.592v3.408a4.74 4.74 0 0 1-4.741 4.74H7.11A4.74 4.74 0 0 1 2.37 14.81V9.186a4.74 4.74 0 0 1 4.74-4.741h10.963v.888z" />
          </svg>
        );
      case "google":
        return (
          <svg className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
          </svg>
        );
      case "email":
        return (
          <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case "qq":
        return (
          <svg className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2c-4.418 0-8 3.582-8 8 0 1.25.289 2.433.805 3.49-1.024 1.708-1.53 3.843-1.021 5.308.203.585.806.84 1.341.57.828-.418 1.625-1.025 2.296-1.722 1.335.539 2.862.854 4.579.854 1.716 0 3.243-.315 4.578-.854.671.697 1.468 1.304 2.296 1.722.535.27 1.138.015 1.341-.57.509-1.465.003-3.6-1.021-5.308C19.71 12.433 20 11.25 20 10c0-4.418-3.582-8-8-8zm-2.5 8c-.828 0-1.5-.895-1.5-2s.672-2 1.5-2 1.5.895 1.5 2-.672 2-1.5 2zm5 0c-.828 0-1.5-.895-1.5-2s.672-2 1.5-2 1.5.895 1.5 2-.672 2-1.5 2z" />
          </svg>
        );
      case "wechat":
        return (
          <svg className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8.5 13.5c-3.59 0-6.5-2.42-6.5-5.4 0-2.98 2.91-5.4 6.5-5.4s6.5 2.42 6.5 5.4c0 2.98-2.91 5.4-6.5 5.4zm7.5 7.8c-2.76 0-5-2.02-5-4.5 0-2.48 2.24-4.5 5-4.5s5 2.02 5 4.5c0 2.48-2.24 4.5-5 4.5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // 没有链接也没有可复制的值时，不渲染空按钮
  if (!url && !onClick) return null;

  const content = (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/40 bg-white/50 text-slate-700 shadow-sm transition-all duration-300 hover:bg-indigo-500 hover:text-white dark:border-white/10 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-indigo-600 dark:hover:text-white md:h-10 md:w-10"
      title={type}
    >
      {getIcon()}
    </div>
  );

  const isMail = Boolean(url && url.startsWith("mailto:"));

  return url ? (
    <a
      href={url}
      {...(isMail ? { title: `写邮件给 ${url.replace("mailto:", "")}` } : { target: "_blank", rel: "noopener noreferrer" })}
    >
      {content}
    </a>
  ) : (
    content
  );
}
