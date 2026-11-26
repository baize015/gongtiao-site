import type { Metadata, Viewport } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";

import { siteConfig } from "@/site.config";
import { themeInitScript } from "@/lib/theme";
import { getMusicTracks } from "@/lib/music";
import Background from "@/components/site/Background";
import Footer from "@/components/site/Footer";
import AICat from "@/components/widgets/AICat";

/* 以下部件移植自原模板 heiehiehi/XinghuisamaBlogs，只改了配置接入与配色桥接 */
import MusicProvider from "@/components/xh/MusicProvider";
import FloatingPlayer from "@/components/xh/FloatingPlayer";
import Navbar from "@/components/xh/Navbar";
import SplashScreen from "@/components/xh/SplashScreen";
import BackgroundEffects from "@/components/xh/BackgroundEffects";
import DanmakuBackground from "@/components/xh/DanmakuBackground";
import ClickEffect from "@/components/xh/ClickEffect";
import GlobalToolbox from "@/components/xh/GlobalToolbox";
import PageTransition from "@/components/xh/PageTransition";
import { ToastProvider } from "@/components/xh/ToastProvider";

const siteUrl = siteConfig.siteUrl || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.navTitle}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.authorName }],
  creator: siteConfig.authorName,
  icons: {
    icon: siteConfig.faviconUrl || "/favicon.svg",
    apple: siteConfig.faviconUrl || "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteUrl,
    siteName: siteConfig.title,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [{ url: siteConfig.avatarUrl }],
  },
  twitter: {
    card: "summary",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.avatarUrl],
  },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8eef5" },
    { media: "(prefers-color-scheme: dark)", color: "#101820" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // 歌单来自 content/music.json（编辑台「音乐」页同步生成），构建期读一次
  const tracks = siteConfig.features.music ? getMusicTracks() : [];

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen">
        <MusicProvider playlist={tracks}>
          <ToastProvider>
            {/* 背景层：雾 + 山影（本站） + 萤火 / 樱 / 地面雾（移植） */}
            <Background />
            <BackgroundEffects />
            <DanmakuBackground />

            <Navbar />
            <main className="pt-24 sm:pt-28">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />

            {siteConfig.features.pet ? <AICat /> : null}
            {siteConfig.features.music ? <FloatingPlayer /> : null}

            <GlobalToolbox />
            <ClickEffect />
            <SplashScreen />
          </ToastProvider>
        </MusicProvider>
      </body>
    </html>
  );
}
