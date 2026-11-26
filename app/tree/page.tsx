import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { getAllPostMeta } from "@/lib/content";
import { PageHeader, SectionTitle } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "灵境",
  description: "用文章与字数换来的经验，一座在雾里慢慢升高的山。",
};

/** 八级山路，阈值从低到高 */
const LEVELS = [
  { name: "初见雾", threshold: 0, line: "雾刚起，第一级石阶还是湿的。" },
  { name: "青石阶", threshold: 300, line: "脚步声开始有了回声。" },
  { name: "半山", threshold: 800, line: "云在脚下，来路看不太清了。" },
  { name: "松风起", threshold: 1500, line: "风从松针里过，像有人低声说话。" },
  { name: "云深处", threshold: 2400, line: "再往上，天色反而亮了一点。" },
  { name: "望月台", threshold: 3600, line: "停下来歇脚，月亮低得可以摸到。" },
  { name: "山脊", threshold: 5000, line: "一边是来时路，一边是没走过的坡。" },
  { name: "无声雪", threshold: 7000, line: "顶上没有风，雪落下来也没有声音。" },
];

/** 山路上八个节点的坐标（viewBox 300 × 520，自下而上） */
const POINTS = [
  { x: 70, y: 470 },
  { x: 150, y: 410 },
  { x: 230, y: 350 },
  { x: 170, y: 288 },
  { x: 85, y: 226 },
  { x: 150, y: 160 },
  { x: 230, y: 102 },
  { x: 170, y: 42 },
];

/** 相邻节点之间的路径段，第 i 段连接节点 i 与 i+1 */
const SEGMENTS = [
  "M70 470 C90 450 125 440 150 410",
  "M150 410 C175 380 215 380 230 350",
  "M230 350 C245 320 200 305 170 288",
  "M170 288 C140 271 105 255 85 226",
  "M85 226 C65 197 125 180 150 160",
  "M150 160 C175 140 215 130 230 102",
  "M230 102 C245 74 195 60 170 42",
];

export default function TreePage() {
  const posts = getAllPostMeta();
  const postCount = posts.length;
  const totalWords = posts.reduce((sum, post) => sum + post.words, 0);
  /* 每篇 120 点，每 100 字再加 1 点 */
  const xp = posts.reduce((sum, post) => sum + 120 + Math.floor(post.words / 100), 0);

  /* 灵境开关 */
  if (!siteConfig.features.levelSystem) {
    return (
      <div className="page-shell pb-24">
        <PageHeader kicker="REALM" title="灵境" description="一条按文章累积的山路。" />
        <div className="glass flex flex-col items-center gap-3 px-6 py-20 text-center">
          <p className="font-serif text-[1.15rem] text-[var(--ink-soft)]">灵境暂未开启。</p>
          <p className="text-[0.85rem] text-[var(--ink-faint)]">
            等某天想认真数一数走过多少路，再打开它。
          </p>
        </div>
      </div>
    );
  }

  /* 当前等级与进度 */
  const levelIndex = LEVELS.reduce((acc, level, i) => (xp >= level.threshold ? i : acc), 0);
  const currentLevel = LEVELS[levelIndex];
  const nextLevel = LEVELS[levelIndex + 1] ?? null;
  const levelProgress = nextLevel
    ? Math.min(100, Math.max(0, ((xp - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100))
    : 100;

  const achievements = [
    { label: "写下第一篇文章", done: postCount >= 1 },
    { label: "写下 5 篇文章", done: postCount >= 5 },
    { label: "写下 10 篇文章", done: postCount >= 10 },
    { label: "累计 1 万字", done: totalWords >= 10_000 },
    { label: "累计 3 万字", done: totalWords >= 30_000 },
    { label: "经验达到 1000 点", done: xp >= 1000 },
    { label: "走到第 4 级 · 松风起", done: levelIndex >= 3 },
    { label: "登上第 8 级 · 无声雪", done: levelIndex >= 7 },
  ];
  const achievedCount = achievements.filter((item) => item.done).length;

  return (
    <div className="page-shell pb-24">
      <PageHeader
        kicker="REALM"
        title="灵境"
        description="这条山路只靠写字往上走：每写一篇文章，山就长高一点。走得慢也没关系，雾本来就很慢。"
      />

      {/* 当前等级 */}
      <section className="glass p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker mb-2">当前所在</p>
            <h2 className="font-serif text-[1.7rem] leading-tight sm:text-[2rem]">
              第 {levelIndex + 1} 级 · {currentLevel.name}
            </h2>
            <p className="mt-2 text-[0.86rem] text-[var(--ink-soft)]">{currentLevel.line}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[1.6rem] leading-none text-[var(--ink)]">
              {xp.toLocaleString("zh-CN")}
              <span className="ml-1 text-[0.72rem] text-[var(--ink-faint)]">经验</span>
            </p>
            <p className="mt-1.5 text-[0.72rem] text-[var(--ink-faint)]">
              {nextLevel
                ? `距离「${nextLevel.name}」还差 ${(nextLevel.threshold - xp).toLocaleString("zh-CN")} 点`
                : "已经走到最后一级了"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--accent)_16%,transparent)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--warm),var(--accent-strong))] transition-[width] duration-300"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right font-mono text-[0.68rem] text-[var(--ink-faint)]">
            {Math.round(levelProgress)}%
          </span>
        </div>
        <p className="mt-2 text-[0.7rem] text-[var(--ink-faint)]">
          {currentLevel.threshold.toLocaleString("zh-CN")}
          {" → "}
          {nextLevel ? nextLevel.threshold.toLocaleString("zh-CN") : currentLevel.threshold.toLocaleString("zh-CN")}
        </p>
      </section>

      {/* 雾中的山 */}
      <section className="mt-14 sm:mt-16">
        <SectionTitle title="山路" hint="亮起的节点，是已经走过的路。" />

        <div
          className="relative mx-auto aspect-[300/520] w-full max-w-[320px]"
          role="img"
          aria-label={`灵境山路：当前第 ${levelIndex + 1} 级，${currentLevel.name}`}
        >
          <svg
            viewBox="0 0 300 520"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="realm-mountain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="realm-mountain-2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--warm)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--warm)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* 远山与近山，只有淡淡的轮廓 */}
            <path
              d="M0 520V372l48-72 42 52 54-88 46 66 54-48 56 58v180Z"
              fill="url(#realm-mountain)"
            />
            <path
              d="M0 520V428l62-40 54 34 60-56 50 40 74-28v142Z"
              fill="url(#realm-mountain-2)"
            />

            {/* 山路的七段 */}
            {SEGMENTS.map((d, i) => (
              <path
                key={d}
                d={d}
                fill="none"
                stroke={levelIndex > i ? "var(--warm)" : "var(--line)"}
                strokeWidth={levelIndex > i ? 2 : 1.4}
                strokeLinecap="round"
                strokeDasharray={levelIndex > i ? undefined : "2 7"}
                opacity={levelIndex > i ? 0.9 : 0.75}
              />
            ))}
          </svg>

          {/* 八个节点 */}
          {LEVELS.map((level, i) => {
            const point = POINTS[i];
            const reached = xp >= level.threshold;
            const isCurrent = i === levelIndex;

            return (
              <div
                key={level.name}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${(point.x / 300) * 100}%`, top: `${(point.y / 520) * 100}%` }}
              >
                {/* 当前节点的脉动光晕 */}
                {isCurrent ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -m-2.5 animate-ping rounded-full border border-[var(--warm)] opacity-50"
                    style={{ animationDuration: "2.8s" }}
                  />
                ) : null}

                <span
                  aria-hidden="true"
                  className={[
                    "block h-3.5 w-3.5 rounded-full border transition-colors",
                    reached
                      ? "border-[var(--warm)]"
                      : "border-[var(--line)] bg-[var(--bg-tint)] opacity-55",
                  ].join(" ")}
                  style={
                    reached
                      ? {
                          background: "var(--warm)",
                          boxShadow: isCurrent
                            ? "0 0 0 5px color-mix(in oklab, var(--warm) 30%, transparent)"
                            : "0 0 0 4px color-mix(in oklab, var(--warm) 18%, transparent)",
                        }
                      : undefined
                  }
                />

                <span
                  className={[
                    "absolute left-1/2 top-4 w-max max-w-[7rem] -translate-x-1/2 whitespace-nowrap text-center text-[0.62rem] tracking-wide",
                    reached ? "text-[var(--ink)]" : "text-[var(--ink-faint)]",
                    isCurrent ? "font-medium" : "",
                  ].join(" ")}
                >
                  {level.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* 山脚说明 */}
        <p className="mt-2 text-center text-[0.72rem] leading-relaxed text-[var(--ink-faint)]">
          每篇文章 120 点 · 每 100 字再加 1 点
          <span className="mx-2 opacity-50">·</span>
          已写 {postCount} 篇，约 {totalWords.toLocaleString("zh-CN")} 字
        </p>
      </section>

      {/* 成就 */}
      <section className="mt-14 sm:mt-16">
        <SectionTitle
          title="路上拾到的东西"
          hint={`已达成 ${achievedCount} / ${achievements.length}`}
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {achievements.map((item) => (
            <li
              key={item.label}
              className={[
                "glass flex items-center gap-3 px-4 py-3.5 transition-opacity",
                item.done ? "" : "opacity-55",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[0.6rem]",
                  item.done
                    ? "border-[var(--warm)] bg-[color-mix(in_oklab,var(--warm)_30%,transparent)] text-[var(--ink)]"
                    : "border-[var(--line)] text-[var(--ink-faint)]",
                ].join(" ")}
              >
                {item.done ? "✓" : "·"}
              </span>
              <span className={item.done ? "text-[0.86rem] text-[var(--ink-soft)]" : "text-[0.86rem] text-[var(--ink-faint)]"}>
                {item.label}
              </span>
              {item.done ? (
                <span className="ml-auto shrink-0 font-mono text-[0.65rem] tracking-wide text-[var(--accent-strong)]">
                  已达成
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-14 text-center font-serif text-[0.92rem] leading-loose text-[var(--ink-faint)]">
        「山不会记得你来过，但你会。」
      </p>
    </div>
  );
}
