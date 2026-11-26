import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { siteConfig } from "@/site.config";

/**
 * 歌单数据。
 *
 * 数据源是 `content/music.json`，由编辑台的「音乐」页（或 npm run music）生成，
 * 你不需要手写这个文件。
 *
 * 为什么不用 siteConfig.music.playlist 直接写死：
 * 网易云歌单一同步就是几十上百首，塞进 .ts 配置里既难改也容易出错，
 * 所以拆成独立的 JSON，构建期读一次就够（静态导出时会被打进 HTML）。
 */

export type MusicTrackData = {
  id: string;
  name: string;
  artist: string;
  cover: string;
  /** 播放地址：网易云的 outer/url 端点，浏览器每次请求都会 302 到最新直链 */
  url: string;
  /** 站内歌词路径，例如 /music/lrc/1234567.lrc */
  lrcUrl?: string;
  duration?: number;
  /** true 表示这首歌当前拉不到音频（VIP / 下架），前端会跳过 */
  unavailable?: boolean;
};

export type MusicData = {
  title: string;
  /** 来源歌单链接，方便以后重新同步 */
  source?: string;
  playlistId?: string;
  syncedAt?: string;
  tracks: MusicTrackData[];
};

const FILE = join(process.cwd(), "content", "music.json");

const fallback: MusicData = {
  title: siteConfig.music.title,
  tracks: [],
};

export function getMusic(): MusicData {
  if (!existsSync(FILE)) return fallback;
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as MusicData;
    if (!Array.isArray(parsed.tracks)) return fallback;
    return {
      title: parsed.title || siteConfig.music.title,
      source: parsed.source,
      playlistId: parsed.playlistId,
      syncedAt: parsed.syncedAt,
      tracks: parsed.tracks,
    };
  } catch (error) {
    console.warn(`[gongtiao] content/music.json 解析失败，先按空歌单处理：${String(error)}`);
    return fallback;
  }
}

/** 能播的歌（去掉拉不到音频的） */
export function getMusicTracks(): MusicTrackData[] {
  return getMusic().tracks.filter((track) => Boolean(track.url) && track.unavailable !== true);
}
