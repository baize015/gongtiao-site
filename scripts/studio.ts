/**
 * 宫迢 · 本地编辑台（Studio）
 *
 * 启动：npm run studio   （或双击「管理端.cmd」）
 * 打开：http://127.0.0.1:4000
 *
 * 它只做三件事：
 *   1. 把 content/posts、content/moments 读成表单；
 *   2. 保存时直接写回 Markdown 文件（格式与手写完全一致）；
 *   3. 「打包上传」调用 scripts/build-static.mjs，产出 gongtiao-site.zip。
 *
 * 不联网、不碰 EdgeOne、不改变现有部署方式。
 */
import { spawn } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";
import matter from "gray-matter";
import { pinyin } from "pinyin-pro";
import { renderMarkdown } from "../lib/markdown";
import { syncPlaylist } from "./music-sync";
import { listSnapshots, readContentJson, restoreSnapshot, snapshot, writeContentJson } from "./history";

const ROOT = process.cwd();
const POSTS_DIR = join(ROOT, "content", "posts");
const MOMENTS_DIR = join(ROOT, "content", "moments");
const PUBLIC_DIR = join(ROOT, "public");
const UI_FILE = join(ROOT, "scripts", "studio-ui.html");

type Kind = "post" | "moment";

type ItemMeta = Record<string, unknown>;

function slugFromTitle(title: string): string {
  const raw = pinyin(title, { toneType: "none", type: "array", nonZh: "consecutive" })
    .join("-")
    .toLowerCase();
  const clean = raw
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return clean || "post";
}

function readDir(kind: Kind): string {
  const dir = kind === "post" ? POSTS_DIR : MOMENTS_DIR;
  if (!existsSync(dir)) {
    throw new Error(`目录不存在：${dir}`);
  }
  return dir;
}

function listFiles(kind: Kind): string[] {
  const dir = readDir(kind);
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md") || name.endsWith(".mdx"))
    .sort()
    .reverse();
}

function parseFile(kind: Kind, file: string) {
  const full = join(readDir(kind), file);
  const raw = readFileSync(full, "utf8");
  const parsed = matter(raw);
  return { file, meta: parsed.data as ItemMeta, body: parsed.content.trimStart() };
}

/** 只保留需要落盘的字段，并保持固定顺序，保证文件长得和手写一致 */
function serialize(kind: Kind, meta: ItemMeta, body: string): string {
  const lines: string[] = ["---"];

  const pushString = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === "") return;
    lines.push(`${key}: ${JSON.stringify(String(value))}`);
  };

  if (kind === "post") {
    pushString("title", meta.title);
    pushString("date", meta.date);
    pushString("description", meta.description);
    if (meta.cover) pushString("cover", meta.cover);
    const tags = Array.isArray(meta.tags)
      ? meta.tags.map((t) => String(t).trim()).filter(Boolean)
      : String(meta.tags ?? "")
          .split(/[,，]/)
          .map((t) => t.trim())
          .filter(Boolean);
    if (tags.length > 0) lines.push(`tags: ${JSON.stringify(tags)}`);
    if (meta.draft === true) lines.push("draft: true");
  } else {
    pushString("date", meta.date);
    if (meta.mood) pushString("mood", meta.mood);
  }

  lines.push("---", "");
  const cleanBody = body.replace(/^\n+/, "").replace(/\s+$/, "");
  return `${lines.join("\n")}\n${cleanBody}\n`;
}

function nextMomentSuffix(kind: Kind, date: string): string {
  const day = date.slice(0, 10);
  const existing = new Set(listFiles(kind));
  for (const letter of "abcdefghijklmnopqrstuvwxyz") {
    if (!existing.has(`${day}-${letter}.md`)) return letter;
  }
  return String(Date.now()).slice(-4);
}

function targetFileName(kind: Kind, meta: ItemMeta, currentFile: string | null): string {
  const date = String(meta.date ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10);
  if (kind === "post") {
    const slugSource = String(meta.slug ?? "").trim();
    const slug = slugSource ? slugSource : slugFromTitle(String(meta.title ?? "post"));
    return `${date}-${slug.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 40) || "post"}.md`;
  }
  if (currentFile) return currentFile;
  return `${date}-${nextMomentSuffix(kind, date)}.md`;
}

function collectCovers(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(svg|png|jpe?g|webp|gif|avif)$/i.test(entry.name)) {
        out.push(`/${full.slice(PUBLIC_DIR.length + 1).split("\\").join("/")}`);
      }
    }
  };
  const images = join(PUBLIC_DIR, "images");
  if (existsSync(images)) walk(images);
  return out.sort();
}

type StudioTrack = {
  id: string;
  name: string;
  artist: string;
  cover: string;
  url: string;
  lrcUrl?: string;
  duration?: number;
  unavailable?: boolean;
};

type StudioMusic = {
  title: string;
  source?: string;
  playlistId?: string;
  syncedAt?: string;
  tracks: StudioTrack[];
};

function readMusic(): StudioMusic {
  const file = join(ROOT, "content", "music.json");
  if (!existsSync(file)) return { title: "雾中电台", tracks: [] };
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<StudioMusic>;
    return {
      title: parsed.title ?? "雾中电台",
      source: parsed.source,
      playlistId: parsed.playlistId,
      syncedAt: parsed.syncedAt,
      tracks: Array.isArray(parsed.tracks) ? parsed.tracks : [],
    };
  } catch (error) {
    console.warn(`[studio] content/music.json 解析失败：${String(error)}`);
    return { title: "雾中电台", tracks: [] };
  }
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > 24 * 1024 * 1024) throw new Error("请求体过大");
    chunks.push(chunk as Buffer);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function json(res: ServerResponse, data: unknown, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(body);
}

function runBuild(): Promise<{ ok: boolean; code: number | null; log: string; zipPath: string; zipExists: boolean }> {
  const zipPath = join(ROOT, "gongtiao-site.zip");
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join(ROOT, "scripts", "build-static.mjs")], {
      cwd: ROOT,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    });
    const lines: string[] = [];
    const push = (buf: Buffer) => {
      for (const line of buf.toString("utf8").split(/\r?\n/)) {
        if (line.trim()) lines.push(line);
        if (lines.length > 400) lines.shift();
      }
    };
    child.stdout.on("data", push);
    child.stderr.on("data", push);
    child.on("close", (code) => {
      resolve({ ok: code === 0, code, log: lines.join("\n"), zipPath, zipExists: existsSync(zipPath) });
    });
    child.on("error", (error) => {
      resolve({ ok: false, code: null, log: `${lines.join("\n")}\n${error.message}`, zipPath, zipExists: existsSync(zipPath) });
    });
  });
}

/** 在资源管理器里选中上传包，方便直接拖进 EdgeOne */
function revealZip(): { ok: boolean; path: string; error?: string } {
  const zipPath = join(ROOT, "gongtiao-site.zip");
  if (!existsSync(zipPath)) return { ok: false, path: zipPath, error: "还没有上传包，先点「打包上传」" };
  if (process.platform !== "win32") return { ok: false, path: zipPath, error: "只有 Windows 能自动打开文件夹" };
  try {
    const child = spawn("explorer.exe", ["/select,", zipPath], { detached: true, stdio: "ignore" });
    child.unref();
    return { ok: true, path: zipPath };
  } catch (error) {
    return { ok: false, path: zipPath, error: (error as Error).message };
  }
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;

  if (req.method === "GET" && (path === "/" || path === "/index.html")) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(readFileSync(UI_FILE, "utf8"));
    return;
  }

  // serve public images so the panel can show avatars / covers / thumbnails
  if (req.method === "GET" && path.startsWith("/images/")) {
    const rel = path.replace(/^\/+/, "");
    const full = join(ROOT, "public", rel);
    const pubRoot = join(ROOT, "public") + sep;
    if (!full.startsWith(pubRoot) || !existsSync(full)) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("not found");
      return;
    }
    const ext = full.slice(full.lastIndexOf(".") + 1).toLowerCase();
    const types: Record<string, string> = {
      svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
      webp: "image/webp", gif: "image/gif", avif: "image/avif", ico: "image/x-icon",
    };
    res.writeHead(200, { "content-type": types[ext] ?? "application/octet-stream", "cache-control": "no-store" });
    res.end(readFileSync(full));
    return;
  }

  if (req.method === "GET" && path === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && path === "/api/list") {
    const posts = listFiles("post").map((file) => {
      const { meta, body } = parseFile("post", file);
      return {
        file,
        title: String(meta.title ?? file),
        date: String(meta.date ?? ""),
        description: String(meta.description ?? ""),
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        draft: meta.draft === true,
        words: body.replace(/\s/g, "").length,
      };
    });
    const moments = listFiles("moment").map((file) => {
      const { meta, body } = parseFile("moment", file);
      return {
        file,
        date: String(meta.date ?? ""),
        mood: String(meta.mood ?? ""),
        preview: body.replace(/\s+/g, " ").slice(0, 60),
      };
    });
    json(res, { posts, moments, covers: collectCovers() });
    return;
  }

  if (req.method === "GET" && path === "/api/item") {
    const kind = (url.searchParams.get("kind") ?? "post") as Kind;
    const file = url.searchParams.get("file") ?? "";
    if (!listFiles(kind).includes(file)) {
      json(res, { error: "文件不存在" }, 404);
      return;
    }
    json(res, parseFile(kind, file));
    return;
  }

  if (req.method === "POST" && path === "/api/save") {
    const payload = (await readBody(req)) as {
      kind: Kind;
      file?: string | null;
      meta?: ItemMeta;
      body?: string;
    };
    const kind = payload.kind === "moment" ? "moment" : "post";
    const meta = payload.meta ?? {};
    const body = payload.body ?? "";
    const dir = readDir(kind);
    const fileName = targetFileName(kind, meta, payload.file ?? null);
    const full = join(dir, fileName);

    const stored: ItemMeta = {
      ...meta,
      date: String(meta.date ?? "").trim() || new Date().toISOString().slice(0, 16).replace("T", " "),
    };
    delete (stored as Record<string, unknown>).slug;

    snapshot(kind);
    writeFileSync(full, serialize(kind, stored, body), "utf8");

    if (payload.file && payload.file !== fileName && listFiles(kind).includes(payload.file)) {
      unlinkSync(join(dir, payload.file));
    }
    json(res, { ok: true, file: fileName });
    return;
  }

  if (req.method === "POST" && path === "/api/delete") {
    const payload = (await readBody(req)) as { kind: Kind; file: string };
    const kind = payload.kind === "moment" ? "moment" : "post";
    if (!listFiles(kind).includes(payload.file)) {
      json(res, { error: "文件不存在" }, 404);
      return;
    }
    snapshot(kind);
    unlinkSync(join(readDir(kind), payload.file));
    json(res, { ok: true });
    return;
  }

  if (req.method === "POST" && path === "/api/preview") {
    const payload = (await readBody(req)) as { markdown?: string };
    const html = await renderMarkdown(payload.markdown ?? "");
    json(res, { html });
    return;
  }

  if (req.method === "POST" && path === "/api/build") {
    const result = await runBuild();
    json(res, result);
    return;
  }

  if (req.method === "POST" && path === "/api/reveal") {
    json(res, revealZip());
    return;
  }

  if (req.method === "GET" && path === "/api/music") {
    json(res, readMusic());
    return;
  }

  if (req.method === "POST" && path === "/api/music/sync") {
    const payload = (await readBody(req)) as { input?: string; limit?: number; withLyrics?: boolean };
    const result = await syncPlaylist({
      input: String(payload.input ?? ""),
      limit: Number(payload.limit ?? 50),
      withLyrics: payload.withLyrics !== false,
      root: ROOT,
      onProgress: (text) => console.log(`[music] ${text}`),
    });
    json(res, result, result.ok ? 200 : 400);
    return;
  }

  if (req.method === "POST" && path === "/api/music/save") {
    const payload = (await readBody(req)) as {
      title?: string;
      tracks?: { id?: string; name?: string; artist?: string; cover?: string; url?: string; lrcUrl?: string; duration?: number; unavailable?: boolean }[];
    };
    const current = readMusic();
    const tracks = (payload.tracks ?? []).map((track) => ({
      id: String(track.id ?? ""),
      name: String(track.name ?? "未知曲目"),
      artist: String(track.artist ?? ""),
      cover: String(track.cover ?? ""),
      url: String(track.url ?? ""),
      ...(track.lrcUrl ? { lrcUrl: String(track.lrcUrl) } : {}),
      ...(typeof track.duration === "number" ? { duration: track.duration } : {}),
      ...(track.unavailable ? { unavailable: true } : {}),
    }));
    const next = {
      title: String(payload.title ?? current.title ?? "雾中电台"),
      ...(current.source ? { source: current.source } : {}),
      ...(current.playlistId ? { playlistId: current.playlistId } : {}),
      ...(current.syncedAt ? { syncedAt: current.syncedAt } : {}),
      tracks,
    };
    writeContentJson("music.json", next, "music");
    json(res, { ok: true, tracks: tracks.length });
    return;
  }

  if (req.method === "GET" && path === "/api/albums") {
    const file = join(ROOT, "content", "albums.json");
    let albums: unknown[] = [];
    if (existsSync(file)) {
      try {
        const parsed = JSON.parse(readFileSync(file, "utf8")) as { albums?: unknown[] };
        albums = Array.isArray(parsed.albums) ? parsed.albums : [];
      } catch (error) {
        console.warn(`[studio] content/albums.json 解析失败：${String(error)}`);
      }
    }
    json(res, { albums });
    return;
  }

  if (req.method === "POST" && path === "/api/albums/save") {
    const payload = (await readBody(req)) as { albums?: unknown[] };
    const albums = (payload.albums ?? []).map((album) => {
      const item = album as Record<string, unknown>;
      const photos = Array.isArray(item.photos) ? item.photos : [];
      return {
        id: String(item.id ?? "").trim() || slugFromTitle(String(item.name ?? "album")),
        name: String(item.name ?? "未命名相册"),
        cover: String(item.cover ?? "") || String((photos[0] as Record<string, unknown> | undefined)?.src ?? ""),
        ...(item.description ? { description: String(item.description) } : {}),
        photos: photos.map((photo) => {
          const p = photo as Record<string, unknown>;
          return {
            src: String(p.src ?? ""),
            ...(p.title ? { title: String(p.title) } : {}),
            ...(p.note ? { note: String(p.note) } : {}),
          };
        }),
      };
    });
    writeContentJson("albums.json", { albums }, "albums");
    json(res, { ok: true, albums: albums.length, photos: albums.reduce((n, a) => n + a.photos.length, 0) });
    return;
  }

  if (req.method === "POST" && path === "/api/upload") {
    const payload = (await readBody(req)) as { name?: string; dataUrl?: string; purpose?: string };
    const dataUrl = String(payload.dataUrl ?? "");
    const match = dataUrl.match(/^data:image\/(png|jpe?g|webp|gif|avif);base64,(.+)$/i);
    if (!match) {
      json(res, { error: "只认 png / jpg / webp / gif / avif 图片" }, 400);
      return;
    }
    const ext = match[1].toLowerCase().replace("jpeg", "jpg");
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > 12 * 1024 * 1024) {
      json(res, { error: "这张图太大了（>12MB），压一下再传" }, 400);
      return;
    }
    // purpose 只认这几个，别的当成 photos。绝不接受路径，避免写到 public 外面
    const folders: Record<string, string> = {
      photos: join("images", "photos"),
      avatar: join("images"),
      friends: join("images", "friends"),
      covers: join("images", "covers"),
      misc: join("images", "misc"),
    };
    const purpose = String(payload.purpose ?? "photos");
    const folder = folders[purpose] ?? folders.photos;
    const dir = join(PUBLIC_DIR, folder);
    mkdirSync(dir, { recursive: true });
    const base = slugFromTitle(String(payload.name ?? "photo").replace(/\.[a-z0-9]+$/i, "")) || "photo";
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    let file = `${stamp}-${base}.${ext}`;
    let guard = 1;
    while (existsSync(join(dir, file))) {
      file = `${stamp}-${base}-${guard++}.${ext}`;
    }
    writeFileSync(join(dir, file), buffer);
    json(res, { ok: true, src: `/${folder.split("\\").join("/")}/${file}`, bytes: buffer.length });
    return;
  }

  if (req.method === "GET" && path === "/api/social") {
    const file = join(ROOT, "content", "social.json");
    let social: Record<string, string> = {};
    if (existsSync(file)) {
      try {
        social = JSON.parse(readFileSync(file, "utf8")) as Record<string, string>;
      } catch (error) {
        console.warn(`[studio] content/social.json 解析失败：${String(error)}`);
      }
    }
    json(res, { social });
    return;
  }

  if (req.method === "POST" && path === "/api/social/save") {
    const payload = (await readBody(req)) as { social?: Record<string, unknown> };
    const incoming = payload.social ?? {};
    const keys = ["email", "qq", "wechat", "github", "gitee", "google", "bilibili"];
    const social: Record<string, string> = {};
    for (const key of keys) {
      const value = incoming[key];
      if (typeof value === "string" && value.trim()) social[key] = value.trim();
    }
    writeContentJson("social.json", social, "social");
    json(res, { ok: true, filled: Object.keys(social).length });
    return;
  }

  if (req.method === "GET" && path === "/api/site") {
    json(res, { site: readContentJson<Record<string, unknown>>("site.json", {}) });
    return;
  }

  if (req.method === "POST" && path === "/api/site/save") {
    const payload = (await readBody(req)) as { site?: Record<string, unknown> };
    const input = payload.site ?? {};
    const errors: string[] = [];
    const warnings: string[] = [];

    const text = (key: string, max: number, required = false) => {
      const value = String(input[key] ?? "").trim();
      if (required && !value) errors.push(`${key} 不能空`);
      if (value.length > max) errors.push(`${key} 太长了（最多 ${max} 字）`);
      return value;
    };
    const isHttp = (value: string) => /^https?:\/\/[^\s]+$/i.test(value);

    const siteUrl = text("siteUrl", 120);
    if (siteUrl && !isHttp(siteUrl)) errors.push("域名要写完整，例如 https://example.com");
    if (siteUrl && siteUrl.endsWith("/")) warnings.push("域名末尾的 / 建议去掉");
    if (siteUrl && siteUrl.startsWith("http://")) warnings.push("http:// 在 EdgeOne 上会被跳转，建议写 https://");

    const navRaw = Array.isArray(input.nav) ? input.nav : [];
    const nav = navRaw
      .map((entry) => {
        const item = entry as Record<string, unknown>;
        return { label: String(item.label ?? "").trim(), href: String(item.href ?? "").trim() };
      })
      .filter((item) => item.label || item.href);
    if (nav.length === 0) errors.push("导航至少要留一条");
    if (nav.length > 12) errors.push("导航最多 12 条，再多就挤了");
    for (const item of nav) {
      if (!item.label) errors.push(`导航里有一条缺名字（${item.href || "空"}）`);
      if (!item.href) errors.push(`导航「${item.label}」缺链接`);
      else if (!item.href.startsWith("/") && !isHttp(item.href)) {
        errors.push(`导航「${item.label}」的链接要以 / 开头，或写完整网址`);
      }
    }
    const hrefs = new Set<string>();
    for (const item of nav) {
      if (hrefs.has(item.href)) warnings.push(`导航里有重复链接：${item.href}`);
      hrefs.add(item.href);
    }

    const homeRaw = (input.home ?? {}) as Record<string, unknown>;
    const lines = (Array.isArray(homeRaw.lines) ? homeRaw.lines : [])
      .map((line) => String(line ?? "").trim())
      .filter(Boolean)
      .slice(0, 3);
    if (lines.some((line) => line.length > 24)) warnings.push("首屏每行建议不超过 24 字，不然会挤");
    const recentPosts = Number(homeRaw.recentPosts ?? 4);
    if (!Number.isFinite(recentPosts) || recentPosts < 0 || recentPosts > 20) {
      errors.push("首页文章条数填 0–20");
    }

    const featuresRaw = (input.features ?? {}) as Record<string, unknown>;
    const features: Record<string, boolean> = {};
    for (const key of ["comments", "aiCat", "music", "pet", "levelSystem", "dailyBriefing"]) {
      features[key] = featuresRaw[key] === true;
    }

    const giscusRaw = (input.giscus ?? {}) as Record<string, unknown>;
    const giscus = {
      enabled: giscusRaw.enabled === true,
      repo: String(giscusRaw.repo ?? "").trim(),
      repoId: String(giscusRaw.repoId ?? "").trim(),
      category: String(giscusRaw.category ?? "Announcements").trim() || "Announcements",
      categoryId: String(giscusRaw.categoryId ?? "").trim(),
      mapping: String(giscusRaw.mapping ?? "pathname").trim() || "pathname",
      strict: giscusRaw.strict === "1" ? "1" : "0",
      reactionsEnabled: giscusRaw.reactionsEnabled === "0" ? "0" : "1",
      inputPosition: giscusRaw.inputPosition === "top" ? "top" : "bottom",
      lang: String(giscusRaw.lang ?? "zh-CN").trim() || "zh-CN",
      themeLight: String(giscusRaw.themeLight ?? "light").trim() || "light",
      themeDark: String(giscusRaw.themeDark ?? "dark_dimmed").trim() || "dark_dimmed",
    };
    if (giscus.repo && !/^[\w.-]+\/[\w.-]+$/.test(giscus.repo)) {
      errors.push("giscus 仓库要写成 用户名/仓库名");
    }
    if (giscus.enabled) {
      if (!giscus.repo || !giscus.repoId) errors.push("评论开着就必须填 giscus 仓库和 repoId");
      if (!giscus.categoryId) errors.push("评论开着就必须填分类 ID");
    }

    const twikooRaw = (input.twikoo ?? {}) as Record<string, unknown>;
    const twikooLangs = ["zh-CN", "zh-TW", "en"];
    const twikoo = {
      enabled: twikooRaw.enabled === true,
      envId: String(twikooRaw.envId ?? "").trim(),
      lang: String(twikooRaw.lang ?? "zh-CN").trim() || "zh-CN",
      placeholder: String(twikooRaw.placeholder ?? "说点什么，山风会把话捎回来。").trim().slice(0, 120),
    };
    if (!twikooLangs.includes(twikoo.lang)) errors.push("Twikoo 语言只支持 zh-CN / zh-TW / en");
    if (twikoo.enabled && !isHttp(twikoo.envId)) {
      errors.push("Twikoo 开着就必须填服务地址，且要以 http:// 或 https:// 开头");
    }

    const catRaw = (input.aiCat ?? {}) as Record<string, unknown>;
    const temperature = Number(catRaw.temperature ?? 0.85);
    if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) errors.push("猫的温度填 0–2");
    const maxOutputTokens = Number(catRaw.maxOutputTokens ?? 160);
    if (!Number.isFinite(maxOutputTokens) || maxOutputTokens < 16 || maxOutputTokens > 2000) {
      errors.push("猫的回复字数上限填 16–2000");
    }

    const footerRaw = (input.footer ?? {}) as Record<string, unknown>;
    const icpRaw = footerRaw.icp as Record<string, unknown> | null | undefined;
    let icp: null | { name: string; link: string } = null;
    if (icpRaw && String(icpRaw.name ?? "").trim()) {
      const link = String(icpRaw.link ?? "").trim() || "https://icp.gov.moe";
      if (!isHttp(link)) errors.push("备案链接要写完整网址");
      icp = { name: String(icpRaw.name).trim(), link };
    }

    const friendApplyRaw = (input.friendApply ?? {}) as Record<string, unknown>;
    const themeRaw = Array.isArray(input.themeColors) ? input.themeColors : [];
    const themeColors = themeRaw
      .map((color) => String(color ?? "").trim())
      .filter((color) => /^#[0-9a-f]{6}$/i.test(color))
      .slice(0, 8);

    if (errors.length > 0) {
      json(res, { error: errors[0], errors }, 400);
      return;
    }

    const site = {
      title: text("title", 80, true),
      navTitle: text("navTitle", 20, true),
      navSuffix: text("navSuffix", 10),
      navAfter: text("navAfter", 30),
      authorName: text("authorName", 30, true),
      bio: text("bio", 160),
      avatarUrl: text("avatarUrl", 200),
      siteUrl,
      buildDate: text("buildDate", 10),
      description: text("description", 200),
      keywords: (Array.isArray(input.keywords) ? input.keywords : [])
        .map((word) => String(word ?? "").trim())
        .filter(Boolean)
        .slice(0, 12),
      faviconUrl: text("faviconUrl", 200),
      chatterTitle: text("chatterTitle", 20),
      chatterDescription: text("chatterDescription", 120),
      themeColors: themeColors.length > 0 ? themeColors : ["#e8eef5", "#d3e0ec", "#c9dcec", "#e6d3b3"],
      defaultPostCover: text("defaultPostCover", 200),
      photoWallImage: text("photoWallImage", 200),
      danmakuList: (Array.isArray(input.danmakuList) ? input.danmakuList : [])
        .map((line) => String(line ?? "").trim())
        .filter(Boolean)
        .slice(0, 40),
      nav,
      home: {
        lines,
        subtitle: String(homeRaw.subtitle ?? "").trim().slice(0, 120),
        recentPosts: Math.round(recentPosts),
        showMoments: homeRaw.showMoments !== false,
      },
      features,
      giscus,
      twikoo,
      aiCat: {
        enabled: catRaw.enabled !== false,
        name: String(catRaw.name ?? "山雾").trim() || "山雾",
        avatar: String(catRaw.avatar ?? "/images/cat.svg").trim() || "/images/cat.svg",
        model: String(catRaw.model ?? "gemini-2.5-flash-lite").trim() || "gemini-2.5-flash-lite",
        systemPrompt: String(catRaw.systemPrompt ?? "").trim().slice(0, 2000),
        maxOutputTokens: Math.round(maxOutputTokens),
        temperature,
        placeholder: String(catRaw.placeholder ?? "跟山雾说点什么…").trim().slice(0, 40),
      },
      footer: {
        since: String(footerRaw.since ?? "2026").trim().slice(0, 4),
        icp,
        badges: (Array.isArray(footerRaw.badges) ? footerRaw.badges : [])
          .map((badge) => String(badge ?? "").trim())
          .filter(Boolean)
          .slice(0, 6),
        copyright: String(footerRaw.copyright ?? "").trim().slice(0, 80),
      },
      friendApply: {
        format: String(friendApplyRaw.format ?? "").slice(0, 800),
      },
    };

    const backup = writeContentJson("site.json", site, "site");
    json(res, { ok: true, warnings, backup });
    return;
  }

  if (req.method === "GET" && path === "/api/friends") {
    json(res, readContentJson<{ friends?: unknown[] }>("friends.json", { friends: [] }));
    return;
  }

  if (req.method === "POST" && path === "/api/friends/save") {
    const payload = (await readBody(req)) as { friends?: unknown[] };
    const errors: string[] = [];
    const friends = (Array.isArray(payload.friends) ? payload.friends : [])
      .map((entry) => {
        const item = entry as Record<string, unknown>;
        return {
          name: String(item.name ?? "").trim(),
          desc: String(item.desc ?? "").trim(),
          url: String(item.url ?? "").trim(),
          avatar: String(item.avatar ?? "").trim(),
          color: String(item.color ?? "").trim(),
        };
      })
      .filter((item) => item.name || item.url);

    if (friends.length > 60) errors.push("友链最多 60 条");
    for (const friend of friends) {
      if (!friend.name) errors.push(`有一条友链没写名字（${friend.url || "空"}）`);
      if (friend.url && !/^https?:\/\//i.test(friend.url)) {
        errors.push(`友链「${friend.name}」的链接要以 http:// 或 https:// 开头`);
      }
      if (!friend.url) errors.push(`友链「${friend.name}」缺链接`);
      if (friend.color && !/^#[0-9a-f]{6}$/i.test(friend.color)) {
        errors.push(`友链「${friend.name}」的颜色要写成 #rrggbb`);
      }
    }
    if (errors.length > 0) {
      json(res, { error: errors[0], errors }, 400);
      return;
    }

    const backup = writeContentJson(
      "friends.json",
      {
        friends: friends.map((friend) => ({
          ...friend,
          avatar: friend.avatar || "/images/friends/f1.svg",
          ...(friend.color ? {} : { color: "#7c9cbf" }),
        })),
      },
      "friends",
    );
    json(res, { ok: true, count: friends.length, backup });
    return;
  }

  if (req.method === "GET" && path === "/api/history") {
    json(res, { snapshots: listSnapshots() });
    return;
  }

  if (req.method === "POST" && path === "/api/history/restore") {
    const payload = (await readBody(req)) as { id?: string };
    const result = restoreSnapshot(String(payload.id ?? ""));
    json(res, result, result.ok ? 200 : 400);
    return;
  }

  if (req.method === "POST" && path === "/api/slug") {
    const payload = (await readBody(req)) as { title?: string };
    json(res, { slug: slugFromTitle(payload.title ?? "") });
    return;
  }

  json(res, { error: "not found" }, 404);
}

function listen(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      handle(req, res).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        if (!res.headersSent) json(res, { error: message }, 500);
        else res.end();
      });
    });
    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE" && port < 4010) resolve(0);
      else reject(error);
    });
    server.listen(port, "127.0.0.1", () => resolve(port));
  });
}

async function boot() {
  const desired = Number(process.env.STUDIO_PORT ?? 4000);
  let active = await listen(desired);
  for (let port = desired + 1; port <= 4010 && active === 0; port++) {
    active = await listen(port);
  }
  if (!active) {
    console.error("[studio] 端口都被占用了，用 STUDIO_PORT=xxxx npm run studio 换一个");
    process.exit(1);
  }

  const url = `http://127.0.0.1:${active}`;
  console.log(`\n  宫迢 · 编辑台已启动： ${url}\n`);
  console.log("  改完点「保存」，再点「打包上传」生成 gongtiao-site.zip。");
  console.log("  关掉这个窗口就停止服务。\n");

  if (process.env.STUDIO_NO_OPEN !== "1" && process.platform === "win32") {
    spawn(process.env.ComSpec ?? "cmd.exe", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  }
}

boot().catch((error: unknown) => {
  console.error("[studio] 启动失败：", error);
  process.exit(1);
});
