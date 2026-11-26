/**
 * 网易云歌单同步。
 *
 * 用法（在项目根目录）：
 *   npm run music -- https://music.163.com/playlist?id=3778678
 *   npm run music -- 3778678 --limit 30 --no-lyrics
 *
 * 做的事：
 *   1. 用网易云公开的歌单详情接口拿到曲目（歌名 / 歌手 / 封面 / 时长）；
 *   2. 逐首探测 `song/media/outer/url` 能不能出音频（VIP、下架会 302 到 /404）；
 *   3. 需要的话把歌词抓下来，写到 public/music/lrc/<id>.lrc；
 *   4. 汇总写进 content/music.json，构建时被读进页面。
 *
 * 为什么播放入口是 outer/url 而不是真实 mp3：
 * 真实 mp3 链接带时间戳会过期，outer/url 每次请求都重新 302 到当下有效的直链，
 * 所以静态站也能长期播放。它是网易云的公开端点，不是私有接口。
 */
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const HEADERS = {
  "user-agent": UA,
  referer: "https://music.163.com/",
  accept: "application/json, text/plain, */*",
};

export type SyncedTrack = {
  id: string;
  name: string;
  artist: string;
  cover: string;
  url: string;
  lrcUrl?: string;
  duration?: number;
  unavailable?: boolean;
};

export type SyncResult = {
  ok: boolean;
  title: string;
  playlistId: string;
  source: string;
  syncedAt: string;
  tracks: SyncedTrack[];
  skipped: { id: string; name: string }[];
  lyrics: number;
  message?: string;
};

export type SyncOptions = {
  input: string;
  limit?: number;
  withLyrics?: boolean;
  /** 项目根目录，默认当前工作目录 */
  root?: string;
  onProgress?: (text: string) => void;
};

/** 从「歌单链接 / 纯数字 ID / 带参数的链接」里抠出歌单 ID */
export function parsePlaylistId(input: string): string | null {
  const text = String(input ?? "").trim();
  if (!text) return null;
  if (/^\d{3,}$/.test(text)) return text;
  const match =
    text.match(/[?&]id=(\d{3,})/) ||
    text.match(/playlist\/(\d{3,})/) ||
    text.match(/(\d{5,})/);
  return match ? match[1] : null;
}

async function fetchJson(url: string, timeoutMs = 15000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    const text = await res.text();
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

/** 探测某首歌能否播放：302 到 /404 或 404 视为不可用 */
async function probeAudio(id: string): Promise<boolean> {
  try {
    const res = await fetch(`https://music.163.com/song/media/outer/url?id=${id}.mp3`, {
      headers: HEADERS,
      redirect: "manual",
    });
    if (res.status !== 302) return res.status === 200;
    const location = res.headers.get("location") ?? "";
    return location.startsWith("http") && !location.includes("music.163.com/404");
  } catch {
    return false;
  }
}

/** 抓歌词（LRC），没有就返回空串 */
async function fetchLyric(id: string): Promise<string> {
  try {
    const data = await fetchJson(`https://music.163.com/api/song/lyric?os=pc&id=${id}&lv=-1&kv=-1&tv=-1`);
    const text: string = data?.lrc?.lyric ?? "";
    return text.trim();
  } catch {
    return "";
  }
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

export async function syncPlaylist(options: SyncOptions): Promise<SyncResult> {
  const root = options.root ?? process.cwd();
  const limit = Math.max(1, Math.min(500, options.limit ?? 50));
  const withLyrics = options.withLyrics !== false;
  const log = options.onProgress ?? (() => {});

  const playlistId = parsePlaylistId(options.input);
  if (!playlistId) {
    return {
      ok: false,
      title: "",
      playlistId: "",
      source: options.input,
      syncedAt: "",
      tracks: [],
      skipped: [],
      lyrics: 0,
      message: "没看懂这个歌单地址，贴 https://music.163.com/playlist?id=xxxx 或者直接贴数字 ID",
    };
  }

  log(`读取歌单 ${playlistId}…`);
  let detail: any;
  try {
    detail = await fetchJson(`https://music.163.com/api/playlist/detail?id=${playlistId}`);
  } catch (error) {
    return {
      ok: false,
      title: "",
      playlistId,
      source: options.input,
      syncedAt: "",
      tracks: [],
      skipped: [],
      lyrics: 0,
      message: `拉歌单失败：${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const result = detail?.result;
  const rawTracks: any[] = Array.isArray(result?.tracks) ? result.tracks : [];
  if (rawTracks.length === 0) {
    return {
      ok: false,
      title: "",
      playlistId,
      source: options.input,
      syncedAt: "",
      tracks: [],
      skipped: [],
      lyrics: 0,
      message: "这个歌单里没有歌（或者歌单是私密的，改成公开再试）",
    };
  }

  const picked = rawTracks.slice(0, limit);
  log(`歌单「${result.name}」共 ${rawTracks.length} 首，取前 ${picked.length} 首…`);

  const lrcDir = join(root, "public", "music", "lrc");
  if (withLyrics) mkdirSync(lrcDir, { recursive: true });

  const tracks: SyncedTrack[] = [];
  const skipped: { id: string; name: string }[] = [];
  let lyricCount = 0;

  const checked = await mapPool(picked, 6, async (item, index) => {
    const playable = await probeAudio(String(item.id));
    log(`  探测 ${index + 1}/${picked.length}：${item.name}${playable ? "" : "（不可播）"}`);
    return playable;
  });

  for (let i = 0; i < picked.length; i += 1) {
    const item = picked[i];
    const cover: string = item?.album?.picUrl ?? item?.album?.blurPicUrl ?? "";
    const track: SyncedTrack = {
      id: String(item.id),
      name: String(item.name ?? "未知曲目"),
      artist: (item.artists ?? []).map((a: any) => a?.name).filter(Boolean).join(" / ") || "未知艺人",
      cover: cover
        ? `${cover.replace(/^http:/, "https:")}${cover.includes("?") ? "&" : "?"}param=200y200`
        : "",
      url: `https://music.163.com/song/media/outer/url?id=${item.id}.mp3`,
      duration: typeof item.duration === "number" ? item.duration : undefined,
    };

    if (!checked[i]) {
      track.unavailable = true;
      skipped.push({ id: track.id, name: track.name });
    }

    if (withLyrics && !track.unavailable) {
      const lrc = await fetchLyric(track.id);
      if (lrc) {
        writeFileSync(join(lrcDir, `${track.id}.lrc`), lrc, "utf8");
        track.lrcUrl = `/music/lrc/${track.id}.lrc`;
        lyricCount += 1;
      }
    }

    tracks.push(track);
  }

  const data = {
    title: String(result.name ?? "雾中电台"),
    source: `https://music.163.com/playlist?id=${playlistId}`,
    playlistId,
    syncedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    tracks,
  };

  const outFile = join(root, "content", "music.json");
  mkdirSync(join(root, "content"), { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  // 清掉这次没再用到的旧歌词，避免 public/ 越滚越大
  if (existsSync(lrcDir)) {
    const keep = new Set(tracks.map((t) => `${t.id}.lrc`));
    for (const name of (await import("node:fs")).readdirSync(lrcDir)) {
      if (name.endsWith(".lrc") && !keep.has(name)) {
        try {
          rmSync(join(lrcDir, name), { force: true });
        } catch {
          /* 删不掉就算了，不影响播放 */
        }
      }
    }
  }

  return {
    ok: true,
    title: data.title,
    playlistId,
    source: data.source,
    syncedAt: data.syncedAt,
    tracks,
    skipped,
    lyrics: lyricCount,
  };
}

const isDirectRun = process.argv[1] && /music-sync\.(ts|mjs|js)$/.test(process.argv[1]);

/* tsx 默认把脚本按 CJS 跑，顶层 await 会报错，所以包一层 main() */
async function main() {
  const args = process.argv.slice(2);
  const input = args.find((a) => !a.startsWith("--"));
  const limitFlag = args.findIndex((a) => a === "--limit");
  const limit = limitFlag >= 0 ? Number(args[limitFlag + 1]) : 50;
  const withLyrics = !args.includes("--no-lyrics");

  if (!input) {
    console.log("用法：npm run music -- <歌单链接或 ID> [--limit 30] [--no-lyrics]");
    process.exit(1);
  }

  const result = await syncPlaylist({ input, limit, withLyrics, onProgress: (text) => console.log(text) });
  if (!result.ok) {
    console.error(`\n[x] ${result.message}`);
    process.exit(1);
  }
  console.log(
    `\n[✓] 《${result.title}》同步完成：${result.tracks.length} 首（其中 ${
      result.tracks.length - result.skipped.length
    } 首可播放），歌词 ${result.lyrics} 份`,
  );
  if (result.skipped.length > 0) {
    console.log(`    跳过不可播放的 ${result.skipped.length} 首：${result.skipped.map((s) => s.name).join("、")}`);
  }
  console.log("    已写入 content/music.json，跑一次打包上传即可生效。");
}

if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
