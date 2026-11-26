/**
 * 音乐部件的共用工具：类型 + LRC 解析 + 播放列表归一化。
 *
 * 原模板（XHBlogs）的播放器数据来自网易云代理 `/api/music` 或第三方 meting 接口，
 * 本站不依赖任何外部音乐 API。这里把「配置里的本地音频直链」归一化成播放器认得的结构：
 *   siteConfig.music.playlist[i] = { id, name, artist, cover, url }
 *
 * 想让某首歌有歌词，可以给条目额外加一个字段（TypeScript 里是可选字段，加在配置里也不会报错）：
 *   lrc:    "[00:12.00]第一句\n[00:18.50]第二句"   // 内联 LRC 文本
 *   lrcUrl: "/music/xxx.lrc"                       // 只接受站内相对路径，不会发出外站请求
 */

export type LyricLine = { time: number; text: string };

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  src: string;
  lyrics: LyricLine[];
  /** 站内 .lrc 地址（可选），只接受以 "/" 开头的相对路径 */
  lrcUrl: string;
};

/** 配置里可能出现的最小信息（兼容 id/name/url 与 id/title/src 两种写法） */
export type RawTrack = {
  id?: string;
  name?: string;
  title?: string;
  artist?: string;
  cover?: string;
  url?: string;
  src?: string;
  lrc?: string;
  lrcUrl?: string;
};

export const EMPTY_LYRIC = "♪ 纯享音乐 ♪";

/** 解析 LRC（支持一行多时间戳、[mm:ss] / [mm:ss.xx] / [mm:ss.xxx]） */
export function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText || lrcText.length > 30000) return [];

  const result: LyricLine[] = [];
  for (const line of lrcText.split(/\r?\n/)) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (matches.length === 0) continue;

    const rawText = line.replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, "").trim();
    // 剔除控制字符与零宽字符
    const text = rawText.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "");
    if (!text) continue;

    for (const match of matches) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3], 10) : 0;
      const divisor = match[3] && match[3].length === 3 ? 1000 : 100;
      result.push({ time: min * 60 + sec + ms / divisor, text });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

/** 只允许站内相对路径，避免客户端去碰外部音乐接口 */
export function isSameOriginPath(url?: string): boolean {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//");
}

/** 把配置里的播放列表（或页面传入的列表）归一化成播放器结构；没有音频地址的条目会被丢掉 */
export function normalizeTracks(raw: readonly RawTrack[] | undefined | null): MusicTrack[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, index): MusicTrack | null => {
      const src = String(item?.src ?? item?.url ?? "").trim();
      if (!src) return null;

      return {
        id: String(item?.id ?? `track-${index}`),
        title: String(item?.title ?? item?.name ?? "未知曲目"),
        artist: String(item?.artist ?? "未知艺人"),
        cover: String(item?.cover ?? ""),
        src,
        lyrics: item?.lrc ? parseLrc(item.lrc) : [],
        lrcUrl: isSameOriginPath(item?.lrcUrl) ? String(item?.lrcUrl) : "",
      };
    })
    .filter((track): track is MusicTrack => track !== null);
}

/** 时间轴 → 当前该显示的那一句 */
export function findActiveLyric(lyrics: LyricLine[], currentTime: number): string | null {
  for (let i = lyrics.length - 1; i >= 0; i -= 1) {
    if (currentTime >= lyrics[i].time) return lyrics[i].text;
  }
  return null;
}
