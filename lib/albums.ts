import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 相册数据，来自 `content/albums.json`。
 * 平时不用手改：打开「管理端.cmd」→「相册」页，拖照片进去就行。
 */

export type Photo = {
  src: string;
  title?: string;
  note?: string;
};

export type Album = {
  id: string;
  name: string;
  cover: string;
  description?: string;
  photos: Photo[];
};

const FILE = join(process.cwd(), "content", "albums.json");

export function getAlbums(): Album[] {
  if (!existsSync(FILE)) return [];
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as { albums?: Album[] };
    const albums = Array.isArray(parsed.albums) ? parsed.albums : [];
    return albums
      .filter((album) => Array.isArray(album.photos))
      .map((album) => ({
        ...album,
        cover: album.cover || album.photos[0]?.src || "",
      }));
  } catch (error) {
    console.warn(`[gongtiao] content/albums.json 解析失败，先按空相册处理：${String(error)}`);
    return [];
  }
}

export function countPhotos(albums: readonly Album[] = getAlbums()): number {
  return albums.reduce((total, album) => total + album.photos.length, 0);
}
