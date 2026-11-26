# 署名与改动说明

本项目（宫迢 · 远山与长路）基于以下开源项目改造而来：

- **原项目**：[heiehiehi/XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs)
- **原作者**：heiehiehi（XingHuiSama）
- **原项目许可**：CC BY-NC 4.0

依照 CC BY-NC 4.0 的署名要求，本文件说明本项目对原项目做了哪些修改。

## 沿用的部分

以下组件来自原项目，移植后做了配色、配置接入与少量行为调整（原文件路径 → 本项目路径）：

| 原项目 | 本项目 |
| --- | --- |
| `XHBlogs/components/SplashScreen.tsx` | `components/xh/SplashScreen.tsx` |
| `XHBlogs/components/BackgroundEffects.tsx` | `components/xh/BackgroundEffects.tsx` |
| `XHBlogs/components/DanmakuBackground.tsx` | `components/xh/DanmakuBackground.tsx` |
| `XHBlogs/components/ClickEffect.tsx` | `components/xh/ClickEffect.tsx` |
| `XHBlogs/components/GlobalToolbox.tsx` | `components/xh/GlobalToolbox.tsx` |
| `XHBlogs/components/toolbox/CalculatorTool.tsx` | `components/xh/toolbox/CalculatorTool.tsx` |
| `XHBlogs/components/PageTransition.tsx` | `components/xh/PageTransition.tsx` |
| `XHBlogs/components/ToastProvider.tsx` | `components/xh/ToastProvider.tsx` |
| `XHBlogs/components/ProfileCard.tsx` | `components/xh/ProfileCard.tsx` |
| `XHBlogs/components/ThemeToggleBlock.tsx` | `components/xh/ThemeToggleBlock.tsx` |
| `XHBlogs/components/ClientTOC.tsx` | `components/xh/ClientTOC.tsx` |
| `XHBlogs/components/LatestPostsCarousel.tsx` | `components/xh/LatestPostsCarousel.tsx` |
| `XHBlogs/components/LatestChatterCarousel.tsx` | `components/xh/LatestChatterCarousel.tsx` |
| `XHBlogs/components/MusicProvider.tsx` / `MusicPlayer.tsx` / `FloatingPlayer.tsx` / `CloudPlayer.tsx` / `LyricBar.tsx` / `SidebarLyric.tsx` | 同名文件，位于 `components/xh/` |
| `XHBlogs/components/SearchBar.tsx` | `components/xh/SearchBar.tsx` |
| `XHBlogs/components/SiteDashboard.tsx` | `components/xh/SiteDashboard.tsx` |
| `XHBlogs/components/Sakura.tsx` / `Fireflies.tsx` / `WindyGrass.tsx` | 同名文件，位于 `components/xh/` |
| `XHBlogs/app/globals.css` 的毛玻璃与雾效基础样式 | `app/globals.css` |

## 主要改动

**视觉**
- 配色从紫粉蓝渐变改为**雾蓝 + 暖白**（`--bg-base` / `--ink` / `--accent` / `--warm` 等 CSS 变量），明暗两套
- 字体改为中文宋体栈，不依赖运行时加载 Google Fonts
- 雾层背景用径向渐变替代 `filter: blur(70px)`（后者会让滚动帧率掉到 30fps）
- 开屏动画重写：上滑雾帘、跟手进度条、中心光晕、四角括号、两端菱形结点、漂浮尘点

**架构**
- 移除 `three` / `@react-three/fiber` / `@react-three/drei`（约 3MB），`/tree` 灵境等级改为纯 CSS/SVG
- 移除全部 `@tiptap/*`（原仅本地 Python 控制台使用）
- 移除 `gitalk`、`next-themes`、`openai` SDK、`rehype-sanitize`
- 移除原项目的 Python 控制台（`my-blog-manager/`），改自研 Node/tsx 编辑台（`scripts/studio.ts` + `studio-ui.html`）

**内容管线**
- `posts/*.md` → `content/posts/*.md`，slug 自动去掉日期前缀
- `siteConfig.ts` 从全量硬编码改为「默认值 + 合并 `content/site.json`」
- 友链 / 相册 / 音乐 / 封面 / 联系方式从 TS 常量改为 JSON 文件，可在线编辑
- 新增构建期内容索引层（`lib/content.ts`）与构建期预渲染

**新增功能（原项目没有）**
- 归档页、标签体系（`/archive`、`/tags`、`/tags/[tag]`）
- RSS / Sitemap / robots.txt
- 版权与图片来源声明页（`/credits`）
- 相册：分组、大图查看、拖动排序、删除、浏览器端压缩上传
- 首页照片墙海报自动轮换
- 公有领域封面池（按 slug 哈希稳定分配）
- 关于页时间线自动生成（`lib/timeline.ts`）
- 13 页可视化编辑台，含内容快照备份与还原、站内预览抽屉
- Twikoo 评论接入（含 Giscus 回退）
- EdgeOne Makers 适配（`edgeone.json`、静态打包脚本、一键 zip）
- 网易云歌单同步脚本（含可播性探测与歌词抓取）

**移除的内容**
- `/chatter` 云杂谈页、`/projects` 项目页
- 天气挂件与天气特效
- `/tree` 的 3D 炼丹炉与帝江模型
- Python 本地控制台与 `update.py` 自动升级脚本

## 封面照片

`content/covers.json` 中的 8 张风景照片来自**美国国家公园管理局（NPS）NPGallery**，属美国政府作品，为**公有领域**，无版权限制。每张的具体作者、原始链接与许可说明都记录在该文件与 `/credits` 页面中。

## 本项目的许可

**[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)** —— 沿用原项目许可。

- 可以自由复制、修改、分发
- 必须保留原作者署名并注明修改
- 不可以用于商业目的
