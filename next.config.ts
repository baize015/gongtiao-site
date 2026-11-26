import type { NextConfig } from "next";

/**
 * 说明（EdgeOne 适配）：
 * 1. EdgeOne 不支持 next.config 里的 redirects / rewrites，需要重定向请写进 edgeone.json。
 * 2. 图片保留 unoptimized：本站图片都放在 public/，不需要额外的图片优化服务。
 * 3. 文章内容全部在构建期读取 content/ 并预渲染，运行时不依赖文件系统。
 *
 * 两种产物：
 * - `npm run build`        → .next（Node 服务端模式，走 Git 导入部署）
 * - `npm run build:static` → out/（纯静态，可整包上传到 EdgeOne「直接上传」）
 *   后者会把 GT_STATIC_EXPORT=1 传进来：开启静态导出、固定带尾斜杠的目录结构，
 *   并把 /api 路由临时移出（静态托管跑不了服务端接口，AI 猫猫会自动降级为本地回话）。
 */
const isStaticExport = process.env.GT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export" as const, trailingSlash: true } : {}),
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  typescript: {
    // 默认仍然做类型检查（EdgeOne 构建时会检查）。
    // 某些受限环境（禁用子进程的沙箱）里 next build 无法 spawn 类型检查进程，
    // 可以本地用 GT_SKIP_TYPECHECK=1 跳过，另跑 npm run lint 检查类型。
    ignoreBuildErrors: process.env.GT_SKIP_TYPECHECK === "1",
  },
};

export default nextConfig;
