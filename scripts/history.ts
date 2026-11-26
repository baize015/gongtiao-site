/**
 * 保存前的快照与还原。
 * 每次写 content/ 之前，先把整个 content/ 复制到 .history/<时间戳>-<原因>/。
 * 只留「最近 2 份 + 内容最多的 1 份」，一共不超过 3 份：省空间，又保住手工改得最全的那一版。
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { isAbsolute, join, normalize, relative } from "node:path";

const ROOT = process.cwd();
const HISTORY_DIR = join(ROOT, ".history");
const CONTENT_DIR = join(ROOT, "content");
const KEEP_RECENT = 2;

export type Snapshot = { id: string; reason: string; at: string; files: number; bytes: number };

function stamp(): string {
  return new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
}

function countFiles(dir: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const inner = countFiles(full);
      files += inner.files;
      bytes += inner.bytes;
    } else {
      files += 1;
      bytes += statSync(full).size;
    }
  }
  return { files, bytes };
}

export function snapshot(reason: string): string | null {
  if (!existsSync(CONTENT_DIR)) return null;
  mkdirSync(HISTORY_DIR, { recursive: true });
  const safeReason = reason.replace(/[^a-z0-9-]+/gi, "-").slice(0, 24) || "save";
  const id = `${stamp()}-${safeReason}`;
  const target = join(HISTORY_DIR, id);
  if (existsSync(target)) return id;
  cpSync(CONTENT_DIR, target, { recursive: true });
  prune();
  return id;
}

function prune() {
  if (!existsSync(HISTORY_DIR)) return;
  const ids = readdirSync(HISTORY_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();
  if (ids.length <= KEEP_RECENT + 1) return;

  const keep = new Set(ids.slice(0, KEEP_RECENT));

  let bestId = "";
  let bestFiles = -1;
  let bestBytes = -1;
  for (const id of ids.slice(KEEP_RECENT)) {
    const stat = countFiles(join(HISTORY_DIR, id));
    if (stat.files > bestFiles || (stat.files === bestFiles && stat.bytes > bestBytes)) {
      bestId = id;
      bestFiles = stat.files;
      bestBytes = stat.bytes;
    }
  }
  if (bestId) keep.add(bestId);

  for (const id of ids) {
    if (!keep.has(id)) rmSync(join(HISTORY_DIR, id), { recursive: true, force: true });
  }
}

export function listSnapshots(): Snapshot[] {
  if (!existsSync(HISTORY_DIR)) return [];
  return readdirSync(HISTORY_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const full = join(HISTORY_DIR, entry.name);
      const { files, bytes } = countFiles(full);
      const rest = entry.name.split("-").slice(1).join("-");
      const iso = entry.name.slice(0, 14);
      return {
        id: entry.name,
        reason: rest || "save",
        at: `${iso.slice(0, 4)}-${iso.slice(4, 6)}-${iso.slice(6, 8)} ${iso.slice(8, 10)}:${iso.slice(10, 12)}:${iso.slice(12, 14)}`,
        files,
        bytes,
      };
    })
    .sort((a, b) => (a.id < b.id ? 1 : -1));
}

export function restoreSnapshot(id: string): { ok: boolean; files?: number; error?: string } {
  if (!/^[0-9]{14}-[a-z0-9-]+$/i.test(id)) return { ok: false, error: "备份编号不像话" };
  const source = join(HISTORY_DIR, id);
  if (!existsSync(source)) return { ok: false, error: "这份备份找不到了" };

  // 先把要还原的那份拷到临时目录：因为 snapshot() 之后会 prune，
  // 有可能会把这份较旧的备份删掉，直接 cpSync 就扑空了。
  const staging = join(HISTORY_DIR, `.restore-${stamp()}`);
  cpSync(source, staging, { recursive: true });

  try {
    snapshot("before-restore");
    rmSync(CONTENT_DIR, { recursive: true, force: true });
    cpSync(staging, CONTENT_DIR, { recursive: true });
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    return { ok: false, error: `还原失败：${String(error)}` };
  }
  rmSync(staging, { recursive: true, force: true });
  return { ok: true, files: countFiles(CONTENT_DIR).files };
}

/** 只允许写 content/ 下面的文件，挡住 ../ 和绝对路径 */
export function safeContentPath(rel: string): string {
  const clean = rel.replace(/^[\\/]+/, "");
  const full = normalize(join(CONTENT_DIR, clean));
  const relToContent = relative(CONTENT_DIR, full);
  if (relToContent.startsWith("..") || isAbsolute(relToContent)) {
    throw new Error(`越界了：${rel}`);
  }
  return full;
}

/** 写入 content/ 下的 JSON，先打快照 */
export function writeContentJson(rel: string, data: unknown, reason: string): string | null {
  const id = snapshot(reason);
  const full = safeContentPath(rel);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return id;
}

export function readContentJson<T>(rel: string, fallback: T): T {
  try {
    const full = safeContentPath(rel);
    if (!existsSync(full)) return fallback;
    return JSON.parse(readFileSync(full, "utf8")) as T;
  } catch (error) {
    console.warn(`[studio] ${rel} 解析失败：${String(error)}`);
    return fallback;
  }
}

export { HISTORY_DIR, CONTENT_DIR };
