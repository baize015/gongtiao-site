# 宫迢 · 远山与长路

一个雾蓝 + 暖白色调的个人小站，用 **Next.js 16（App Router）** 写成，为 **EdgeOne Makers** 的「直接上传」流程做了适配。

- 文章、碎碎念、相册、友链、音乐、评论、AI 猫，都能在本地编辑台里点着改
- 内容全部是文件（Markdown + JSON），不需要数据库，也不需要线上后台
- 改完点一下「打包上传」，把生成的 zip 拖进 EdgeOne 就上线

> 本仓库是**脱敏骨架版**：示例文章、示例相册、占位域名。换成你自己的内容就能用。

---

## 一、快速开始

需要 Node.js **20.9 或更新版本**（推荐 22 LTS）。

```bash
npm install
npm run dev
```

打开 http://localhost:3000 。

Windows 上也可以直接双击：

| 文件 | 作用 |
| --- | --- |
| `预览站点.cmd` | 装依赖并启动本地预览 |
| `编辑台.cmd` | 打开可视化编辑台（默认 4000 端口） |
| `打包上传包.cmd` | 生成静态站点并打包成 zip |

---

## 二、写作

每篇文章是 `content/posts/` 下的一个 `.md` 文件，文件名格式 `YYYY-MM-DD-slug.md`。日期只用来排序，**slug 才是网址**——`2026-01-01-hello.md` 的地址是 `/posts/hello`。

```markdown
---
title: "文章标题"
date: "2026-01-01 20:00:00"
description: "列表页显示的一句话简介"
cover: "/images/covers/mist.svg"
tags: ["随笔", "建站"]
---

正文用 Markdown 写。
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题 |
| `date` | 是 | `2026-01-01 20:00:00` |
| `description` | 否 | 列表页简介 |
| `cover` | 否 | 留空则自动从封面池挑一张 |
| `tags` | 否 | 数组，会生成标签页 |
| `draft` | 否 | `true` 时只在本地可见，不会被打包 |

新建文章可以用编辑台，也可以：

```bash
npm run new -- "文章标题" my-slug
```

碎碎念放 `content/moments/`，格式只要 `date` + 正文：

```markdown
---
date: "2026-01-02 21:30:00"
mood: "雾"
---

两句话，或者一句。
```

图片放 `public/images/` 下，引用时写 `/images/xxx.jpg`。

---

## 三、编辑台

`npm run studio`（或双击 `编辑台.cmd`）会启动一个本地服务，浏览器里操作，所有改动直接写进 `content/`。

十三个页签：

- **内容**：文章 / 碎碎念 / 相册 / 音乐
- **站点**：基本信息 / 导航 / 开关 / 友链 / 评论 / 猫 / 联系方式 / 备份

几个细节：

- **相册**：拖拽上传照片，浏览器端会先压到长边 1600 再上传；点开任意一张可以看大图、左右移动、删除
- **备份**：每次保存内容前自动快照到 `.history/`，保留「最近 2 份 + 内容最全的 1 份」；备份页可以一键还原
- **站内预览**：右上角「预览站内」会打开抽屉，iframe 加载的是 `site.json` 里 `siteUrl` 指向的线上站点（改动要先打包才会变）
- **未打包提醒**：改过内容但没打包时，顶部会出现琥珀色提示条

上传接口只接受白名单目录（`photos` / `avatar` / `friends` / `covers` / `misc`），不接受任意路径。

---

## 四、站点配置

所有可编辑项都在 `content/site.json`，编辑台的页签就是它的可视化版本。`site.config.ts` 负责「默认值 + 合并 JSON」，一般不需要手改。

常改的几个：

| 键 | 说明 |
| --- | --- |
| `title` / `navTitle` / `navSuffix` / `navAfter` | 站名与导航栏三段式标题 |
| `authorName` / `bio` / `avatarUrl` | 作者、简介、头像 |
| `siteUrl` | 线上域名，影响 SEO / RSS / 分享卡片 / 编辑台预览 |
| `home.lines` | 首页两行大字 |
| `nav` | 导航项数组（增删改排序都在编辑台里做） |
| `features` | 六个功能开关，见下 |
| `footer` | 建站年份、备案、徽章 |

`features` 可以一键关掉不想要的模块：

```json
{ "comments": true, "aiCat": true, "music": true,
  "pet": true, "levelSystem": true, "dailyBriefing": false }
```

---

## 五、封面池

`content/covers.json` 里是 8 张**公有领域**风景照（美国国家公园管理局 NPS，美国政府作品，无版权限制），带作者与来源链接。

文章没写 `cover` 时，按 slug 做哈希稳定取一张——同一篇文章永远是同一张图，不会每次刷新都变。`/credits` 页会自动列出全部来源。

想换成自己的图：把图片放进 `public/images/covers/`，改 `covers.json` 里的 `src` 就行。

---

## 六、音乐

支持网易云歌单：在编辑台「音乐」页贴歌单链接或 ID，点同步。

同步脚本会：

1. 拉取歌单前 N 首（默认 50）
2. 并发探测每首能不能播（VIP / 下架会被标记为不可播并跳过）
3. 抓歌词存到 `public/music/lrc/`
4. 写入 `content/music.json`

命令行也可以：

```bash
npm run music -- https://music.163.com/playlist?id=123456789 --limit 30
```

不配音乐也能跑——播放器会显示「未配置音频」并禁用播放。

---

## 七、评论

两级回退：

1. **Twikoo**（推荐，有后台审核队列）——在编辑台「评论」页填 `envId` 并启用
2. **Giscus**（基于 GitHub Discussions）——填 repo / repoId / categoryId
3. 都没开时，文章底部显示「评论未开启」

Twikoo 的部署方式见 [官方文档](https://twikoo.js.org/backend.html)。想零成本可以部署到 EdgeOne Makers：

1. 下载 [edgeone-makers 模板 zip](https://github.com/twikoojs/twikoo/raw/main/templates/edgeone-makers/twikoo-edgeone-makers.zip)
2. EdgeOne 控制台「直接上传」拖进去
3. 项目设置里把 Node.js 版本改成 `24.18.0`，重新部署
4. 绑定一个子域名（如 `comment.example.com`），默认的 `*.edgeone.cool` 只有 3 小时有效
5. 把该地址填进编辑台「评论 → envId」，重新打包上传本站
6. 打开线上文章页，评论框里的「管理」可以设管理员密码、开启审核

---

## 八、AI 猫猫

右下角的猫会调用 `/api/chat`，转发到任意 OpenAI 兼容接口。Key 只走环境变量，不写进代码。

```bash
# .env.local
AI_API_KEY=sk-...
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

不填也能跑：接口会返回一句本地兜底话，猫猫照样在，只是不会真回答。

---

## 九、部署到 EdgeOne Makers

### 方式 A：直接上传（本项目默认）

```bash
npm run build:static
```

会生成 `out/` 和 `gongtiao-site.zip`（Windows 上会自动在资源管理器里选中）。把这个 zip 拖进 EdgeOne 控制台的「直接上传」。

**不要**自己压缩 `out/` 文件夹——Windows 自带压缩会写反斜杠路径，提交会报错。用脚本生成的 zip。

### 方式 B：Git 导入

推到 GitHub / Gitee 等平台，EdgeOne 里选「导入 Git 仓库」，构建命令 `npm run build`，输出目录 `.next`（服务端模式），Node 版本 `22.11.0`。

`edgeone.json` 已经配好构建命令、缓存头和安全头：

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "nodeVersion": "22.11.0",
  "headers": [ ... ]
}
```

> EdgeOne 不支持 `next.config` 里的 `redirects` / `rewrites`，要写就写在 `edgeone.json` 里。

### 环境变量

| 变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 站点域名，覆盖 `site.json` 的 `siteUrl` |
| `AI_API_KEY` | AI 猫的 Key（可选） |
| `AI_BASE_URL` | 接口地址，默认 DeepSeek |
| `AI_MODEL` | 模型名 |

---

## 十、目录结构

```
app/                    页面路由（App Router）
  api/chat/             唯一的动态接口：AI 猫
  posts/ archive/ tags/ 文章列表、详情、归档、标签
  photos/ moments/      相册、碎碎念
  about/ credits/       关于、版权与图片来源
components/
  site/                 导航、页脚、背景、评论
  ui/                   图标、区块标题
  widgets/              AI 猫
  xh/                   从原模板移植并改造的特效与播放器
content/                ★ 你的内容都在这里
  posts/ moments/       文章、碎碎念（Markdown）
  site.json             站点配置
  albums.json           相册
  friends.json          友链
  music.json            歌单
  covers.json           封面池
  social.json           联系方式
lib/                    内容读取、Markdown 渲染、主题等
scripts/
  studio.ts             本地编辑台服务
  studio-ui.html        编辑台界面
  build-static.mjs      静态构建 + 打包
  music-sync.ts         网易云歌单同步
  new-post.mjs          新建文章
public/                 favicon、头像、封面、相册图、歌词
```

---

## 十一、几个实现说明

- **内容页全部构建期预渲染**，只有 `/api/*` 是动态路由。这样静态托管和 serverless 都能跑。
- **`output: "export"` 是构建时切开的**：`build-static.mjs` 会临时把 `app/api` 挪走，用 `GT_STATIC_EXPORT=1` 跑一次 `next build`，产完 `out/` 再挪回来。所以 `npm run dev` / `npm run build` 仍然是完整的 Next 应用。
- **主题**：明暗两套色值都在 `app/globals.css` 的 CSS 变量里，首屏内联脚本读 `localStorage` 避免闪白。
- **动效克制**：雾层用径向渐变代替 `filter: blur()`（后者会让滚动掉到 30fps），开屏、页面切换都控制在 0.3–0.6 秒。

---

## 十二、许可与致谢

本项目基于 [heiehiehi/XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) 的视觉与部分组件改造而来，原作者以 **CC BY-NC 4.0** 授权。

因此本项目同样采用 **[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)**：

- ✅ 可以自由复制、修改、分发
- ✅ 必须保留原作者署名，并注明做了哪些修改
- ❌ 不可以用于商业目的

封面照片来自美国国家公园管理局 NPGallery，属美国政府作品（公有领域），具体作者与来源见 `/credits` 页与 `content/covers.json`。

详细署名与改动说明见 [NOTICE.md](./NOTICE.md)。
