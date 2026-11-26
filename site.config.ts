/**
 * ============================================================
 *  宫迢 · 远山与长路  ——  全站「控制中心」
 *
 *  ⚠ 这个文件现在只是「默认值 + 合并逻辑」。
 *     真正的内容在 content/site.json 里，由管理端（npm run studio）写。
 *     想手改也可以，改 content/site.json 即可，改完这一层不用动。
 * ============================================================
 */

import overrides from "./content/site.json";

type NavItem = { label: string; href: string };

type Giscus = {
  enabled: boolean;
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping: string;
  strict: string;
  reactionsEnabled: string;
  inputPosition: string;
  lang: string;
  themeLight: string;
  themeDark: string;
};

type Twikoo = {
  enabled: boolean;
  envId: string;
  lang: string;
  placeholder: string;
};

type AiCat = {
  enabled: boolean;
  name: string;
  avatar: string;
  model: string;
  systemPrompt: string;
  maxOutputTokens: number;
  temperature: number;
  placeholder: string;
};

type Home = {
  lines: string[];
  subtitle: string;
  recentPosts: number;
  showMoments: boolean;
};

type Features = {
  comments: boolean;
  aiCat: boolean;
  music: boolean;
  pet: boolean;
  levelSystem: boolean;
  dailyBriefing: boolean;
};

type Footer = {
  since: string;
  icp: null | { name: string; link: string };
  badges: string[];
  copyright: string;
};

type FriendApply = { format: string };

type Overrides = Partial<{
  title: string;
  navTitle: string;
  navSuffix: string;
  navAfter: string;
  authorName: string;
  bio: string;
  avatarUrl: string;
  siteUrl: string;
  buildDate: string;
  description: string;
  keywords: string[];
  faviconUrl: string;
  chatterTitle: string;
  chatterDescription: string;
  themeColors: string[];
  defaultPostCover: string;
  photoWallImage: string;
  danmakuList: string[];
  useGradient: boolean;
  bgImages: string[];
  bgGroups: { id: string; name: string; images: string[] }[];
  activeBgGroup: string;
  cloudMusicIds: string[];
  nav: NavItem[];
  home: Partial<Home>;
  features: Partial<Features>;
  giscus: Partial<Giscus>;
  twikoo: Partial<Twikoo>;
  aiCat: Partial<AiCat>;
  footer: Partial<Footer>;
  friendApply: Partial<FriendApply>;
}>;

const raw = overrides as Overrides;
// 嵌套字段单独合并，其余顶层字段直接覆盖
const { home, features, giscus, twikoo, aiCat, footer, friendApply, nav, ...flat } = raw;

const base = {
  /* ---------- 一、基本信息 ---------- */
  title: "宫迢 · 远山与长路",
  navTitle: "宫迢",
  navSuffix: " · ",
  navAfter: "远山与长路",
  authorName: "宫迢",
  bio: "在雾里写字的人。远山是未至，长路是已行。",
  avatarUrl: "/images/avatar.svg",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
  buildDate: "2026-11-18",
  description: "宫迢的个人小站：文章、碎碎念、相册与一些没用的东西。",
  keywords: ["宫迢", "个人博客", "随笔", "远山与长路"],

  /* ---------- 二、导航 ---------- */
  nav: [
    { label: "首页", href: "/" },
    { label: "文章", href: "/posts" },
    { label: "碎碎念", href: "/moments" },
    { label: "相册", href: "/photos" },
    { label: "音乐", href: "/music" },
    { label: "灵境", href: "/tree" },
    { label: "友链", href: "/friends" },
    { label: "关于", href: "/about" },
  ] as NavItem[],

  /* ---------- 三、首页 ---------- */
  home: {
    lines: ["远山有雾", "长路无涯"],
    subtitle: "山间的雾散得很慢，像一些话，不必急着说完。",
    recentPosts: 4,
    showMoments: true,
  } as Home,

  /* ---------- 四、社交（没有的留空即可，会自动隐藏） ---------- */
  social: {
    github: "",
    gitee: "",
    google: "",
    email: "",
    bilibili: "",
    qq: "",
    wechat: "",
    rss: "/rss.xml",
  },

  /* ---------- 五、功能开关 ---------- */
  features: {
    comments: true,
    aiCat: true,
    music: true,
    pet: true,
    levelSystem: true,
    dailyBriefing: false,
  } as Features,

  /* ---------- 六、giscus 评论 ----------
   * 三步配好：https://giscus.app 装 app → 拿 repo/repoId/categoryId → 填进去把 enabled 改成 true
   */
  giscus: {
    enabled: false,
    repo: "",
    repoId: "",
    category: "Announcements",
    categoryId: "",
    mapping: "pathname",
    strict: "0",
    reactionsEnabled: "1",
    inputPosition: "bottom",
    lang: "zh-CN",
    themeLight: "light",
    themeDark: "dark_dimmed",
  } as Giscus,

  /* ---------- 六·二、Twikoo 评论（自托管，带后台审核） ----------
   * 服务端自己部署（Zeabur/Railway/Netlify + MongoDB Atlas 免费层），
   * 这里只填服务地址 envId，前端运行时从 CDN 加载 twikoo 脚本。
   */
  twikoo: {
    enabled: false,
    envId: "",
    lang: "zh-CN",
    placeholder: "说点什么，山风会把话捎回来。",
  } as Twikoo,

  /* ---------- 七、音乐占位（真实曲目在 content/music.json） ---------- */
  music: {
    title: "雾中电台",
    playlist: [{ id: "1", name: "示例曲目", artist: "宫迢", cover: "", url: "" }],
  },

  /* ---------- 八、AI 猫猫 ---------- */
  aiCat: {
    enabled: true,
    name: "山雾",
    avatar: "/images/cat.svg",
    model: "gemini-2.5-flash-lite",
    systemPrompt:
      "你是一只住在山里的小猫，名字叫山雾。你的主人是一个喜欢在雾天写字的普通人。\n" +
      "说话要求：\n" +
      "1. 每次最多两句话，不超过 60 字。\n" +
      "2. 语气懒散、温柔，偶尔有点小脾气。\n" +
      "3. 句尾偶尔加「喵」，但不要每句都加。\n" +
      "4. 绝不承认自己是 AI，你就是一只真的猫。",
    maxOutputTokens: 160,
    temperature: 0.85,
    placeholder: "跟山雾说点什么…",
  } as AiCat,

  /* ---------- 九、页脚 ---------- */
  footer: {
    since: "2026",
    icp: null as null | { name: string; link: string },
    badges: ["Next.js 16", "React 19", "Tailwind 4"],
    copyright: "",
  } as Footer,

  /* ---------- 十、友链申请说明 ---------- */
  friendApply: {
    format: `名称：宫迢 · 远山与长路
简介：在雾里写字的人
链接：https://你的域名
头像：https://你的域名/images/avatar.svg`,
  } as FriendApply,

  /* ---------- 十一、原模板组件所需的兼容字段 ---------- */
  faviconUrl: "/favicon.svg",
  useGradient: true,
  themeColors: ["#e8eef5", "#d3e0ec", "#c9dcec", "#e6d3b3"],
  bgImages: [] as string[],
  bgGroups: [{ id: "mist", name: "山间薄雾", images: [] as string[] }],
  activeBgGroup: "mist",

  defaultPostCover: "/images/covers/default.svg",
  photoWallImage: "/images/photos/p1.svg",
  cloudMusicIds: [] as string[],

  counts: { photos: 6 },

  chatterTitle: "碎碎念",
  chatterDescription: "短句、碎片、没头没尾的话",

  danmakuList: [
    "远山有雾",
    "今天的雾很大",
    "写点什么吧",
    "山里的信号不太好",
    "又有人上山了",
    "路还长",
    "喝口水再走",
    "字先落地，雾再散",
  ],

  enableLevelSystem: true,

  footerBadges: [
    {
      name: "Next.js 16",
      color: "text-sky-500",
      svg: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>',
    },
    {
      name: "React 19",
      color: "text-cyan-400",
      svg: '<path d="M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z"/>',
    },
    {
      name: "Tailwind 4",
      color: "text-teal-400",
      svg: '<path d="M6 12c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.9.2 1.6.9 2.3 1.6 1.2 1.2 2.5 2.6 5.5 2.6 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.9-.2-1.6-.9-2.3-1.6C10.3 13.4 9 12 6 12z"/>',
    },
  ],
};

const merged = {
  ...base,
  ...flat,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || flat.siteUrl || base.siteUrl,
  nav: nav && nav.length > 0 ? nav : base.nav,
  home: { ...base.home, ...home },
  features: { ...base.features, ...features },
  giscus: { ...base.giscus, ...giscus },
  twikoo: { ...base.twikoo, ...twikoo },
  aiCat: { ...base.aiCat, ...aiCat },
  footer: { ...base.footer, ...footer },
  friendApply: { ...base.friendApply, ...friendApply },
};

export const siteConfig = {
  ...merged,
  /** 模板组件读的精简版说明，跟着 friendApply.format 走 */
  friendLinkApplyFormat: merged.friendApply.format,
  /** 模板组件读的猫猫配置，跟着 aiCat 走 */
  geminiConfig: {
    modelId: merged.aiCat.model,
    systemPrompt: merged.aiCat.systemPrompt,
    maxOutputTokens: merged.aiCat.maxOutputTokens,
    temperature: merged.aiCat.temperature,
  },
};

export type SiteConfig = typeof siteConfig;
