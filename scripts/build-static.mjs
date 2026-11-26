#!/usr/bin/env node
/**
 * 打一个可以「直接上传」到 EdgeOne 的静态包。
 *
 * 做的事：
 * 1. 把 app/api 临时挪走（静态托管没有服务端，Route Handler 会让静态导出报错）；
 * 2. 用 GT_STATIC_EXPORT=1 跑 next build，产物在 out/；
 * 3. 把 app/api 挪回来（无论成功失败）；
 * 4. 用自研 zip 打包器生成 gongtiao-site.zip（正斜杠 + 纯 ASCII 条目名，
 *    这是 EdgeOne「直接上传」的硬要求）；
 * 5. 报告文件数与体积。
 *
 * 用法：npm run build:static
 * 上传：把 gongtiao/gongtiao-site.zip 拖进 EdgeOne「直接上传」。
 */
import { spawnSync, spawn } from "node:child_process";
import { cpSync, existsSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { makeZip } from "./zip-out.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const apiDir = join(root, "app", "api");
const stashDir = join(root, ".static-export-stash", "api");
const outDir = join(root, "out");

function walk(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const inner = walk(full);
      files += inner.files;
      bytes += inner.bytes;
    } else {
      files += 1;
      bytes += statSync(full).size;
    }
  }
  return { files, bytes };
}

/**
 * 打包完成后直接把 zip 所在位置弹出来（在资源管理器里选中它），
 * 这样打包完就能立刻拖进 EdgeOne。
 * 设 GT_NO_OPEN=1 可关闭（自动化测试用）。
 */
function openInExplorer(target) {
  if (process.platform !== "win32") return;
  if (process.env.GT_NO_OPEN === "1") return;
  try {
    const child = spawn("explorer.exe", ["/select,", target], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    console.log("[static] 已在资源管理器中打开上传包所在位置。");
  } catch (error) {
    console.warn(`[static] 打开文件夹失败：${error.message}`);
  }
}

let moved = false;
if (existsSync(apiDir)) {
  rmSync(stashDir, { recursive: true, force: true });
  cpSync(apiDir, stashDir, { recursive: true });
  rmSync(apiDir, { recursive: true, force: true });
  moved = true;
  console.log("[static] 已临时移除 app/api（静态托管没有服务端接口）");
}

try {
  rmSync(outDir, { recursive: true, force: true });
  // next dev 会把 app/api 的路由写进 .next/dev/types/validator.ts，
  // 而我们刚刚把 app/api 挪走了，留着它构建必挂，先清掉。
  rmSync(join(root, ".next", "dev"), { recursive: true, force: true });
  rmSync(join(root, ".next", "types"), { recursive: true, force: true });
  const run = spawnSync(process.execPath, [join(root, "node_modules", "next", "dist", "bin", "next"), "build"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, GT_STATIC_EXPORT: "1", NEXT_TELEMETRY_DISABLED: "1" },
  });
  if (run.status !== 0) {
    console.error(`[static] next build 失败，退出码 ${run.status}`);
    process.exitCode = run.status ?? 1;
  } else if (!existsSync(outDir)) {
    console.error("[static] 没有生成 out/ 目录");
    process.exitCode = 1;
  } else {
    const { files, bytes } = walk(outDir);
    console.log(`\n[static] 完成：out/ 共 ${files} 个文件，约 ${(bytes / 1024 / 1024).toFixed(2)} MB`);
    const zipPath = join(root, "gongtiao-site.zip");
    const zip = makeZip(outDir, zipPath);
    console.log(`[static] 上传包已生成：${zipPath}（${zip.files} 个条目，${(zip.bytes / 1024 / 1024).toFixed(2)} MB）`);
    console.log("[static] 把这个 zip 拖进 EdgeOne「直接上传」即可（文件名与内部路径都已纯 ASCII）。");
    openInExplorer(zipPath);
  }
} finally {
  if (moved) {
    rmSync(apiDir, { recursive: true, force: true });
    renameSync(stashDir, apiDir);
    rmSync(join(root, ".static-export-stash"), { recursive: true, force: true });
    console.log("[static] app/api 已恢复");
  }
}
