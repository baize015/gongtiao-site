---
title: "写作与发布流程"
date: "2026-01-05 10:00:00"
description: "从新建文章到线上生效，一共四步。"
cover: "/images/covers/book.svg"
tags: ["说明", "使用"]
---

## 方式一：用编辑台（推荐）

双击 `编辑台.cmd`，打开后依次是「文章 → 新建」，填标题、短名、简介、标签，写完保存，再点右上角「打包上传」。生成的 zip 拖进 EdgeOne 的「直接上传」就上线了。

短名（slug）只保留小写字母、数字和连字符，它会成为文章的网址。

## 方式二：直接建文件

```bash
npm run new -- "文章标题" my-slug
```

它会在 `content/posts/` 里生成一个带 frontmatter 的空文件，打开写完就行。

## frontmatter 字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题 |
| `date` | 是 | `2026-01-01 10:00:00` 这种格式 |
| `description` | 否 | 列表页的一句话简介 |
| `cover` | 否 | 不填会自动分配封面池里的图 |
| `tags` | 否 | 数组，会生成标签页 |
| `draft` | 否 | 写 `true` 就只在本地可见，不会被打包 |

## 本地预览

```bash
npm install
npm run dev
```

打开 http://localhost:3000 就能看到。改完文件保存，页面会自动刷新。
