"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/site.config";

const { twikoo, giscus } = siteConfig;

/** Twikoo CDN：主用 jsdelivr，失败换 unpkg 兜底（版本固定 1.6.44） */
const TWIKOO_VERSION = "1.6.44";
const TWIKOO_CDN_PRIMARY = `https://cdn.jsdelivr.net/npm/twikoo@${TWIKOO_VERSION}/dist/twikoo.all.min.js`;
const TWIKOO_CDN_FALLBACK = `https://unpkg.com/twikoo@${TWIKOO_VERSION}/dist/twikoo.all.min.js`;

declare global {
  interface Window {
    twikoo?: {
      init: (opts: Record<string, unknown>) => void;
      refresh?: () => void;
    };
  }
}

/** 动态注入 twikoo 脚本，等 window.twikoo 就绪后 resolve */
function loadTwikoo(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.twikoo) {
      resolve();
      return;
    }
    const inject = (src: string, onError: () => void) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => {
        if (window.twikoo) resolve();
        else onError();
      };
      script.onerror = onError;
      document.head.appendChild(script);
    };
    inject(TWIKOO_CDN_PRIMARY, () => {
      // 主 CDN 失败，用 unpkg 再试一次
      inject(TWIKOO_CDN_FALLBACK, () => reject(new Error("twikoo 脚本加载失败")));
    });
  });
}

/** 站点评论：优先 Twikoo（带后台审核），否则回退 Giscus，都没开则显示提示。 */
export default function Comments() {
  const holder = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  const useTwikoo = twikoo.enabled && twikoo.envId.trim() !== "";
  const useGiscus =
    !useTwikoo && giscus.enabled && giscus.repo && giscus.repoId && giscus.categoryId;

  useEffect(() => {
    if (useTwikoo) {
      const el = holder.current;
      if (!el) return;

      let cancelled = false;
      setError("");

      const applyTheme = () => {
        const theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
        el.dataset.theme = theme;
        return theme;
      };

      el.innerHTML = "";
      applyTheme();
      loadTwikoo()
        .then(() => {
          if (cancelled || !el.isConnected) return;
          const tw = window.twikoo;
          if (!tw) throw new Error("window.twikoo 未就绪");
          tw.init({
            envId: twikoo.envId,
            el,
            lang: twikoo.lang,
            placeholder: twikoo.placeholder,
            path: window.location.pathname,
          });
        })
        .catch(() => {
          if (!cancelled) setError("评论加载失败，请稍后再试。");
        });

      // 深浅色切换时同步主题并刷新
      const observer = new MutationObserver(() => {
        const node = holder.current;
        if (!node) return;
        applyTheme();
        window.twikoo?.refresh?.();
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      return () => {
        cancelled = true;
        observer.disconnect();
        el.innerHTML = "";
      };
    }

    if (useGiscus) {
      const el = holder.current;
      if (!el) return;

      const currentTheme = () =>
        document.documentElement.dataset.theme === "dark" ? giscus.themeDark : giscus.themeLight;

      el.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://giscus.app/client.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      const attrs: Record<string, string> = {
        "data-repo": giscus.repo,
        "data-repo-id": giscus.repoId,
        "data-category": giscus.category,
        "data-category-id": giscus.categoryId,
        "data-mapping": giscus.mapping,
        "data-strict": giscus.strict,
        "data-reactions-enabled": giscus.reactionsEnabled,
        "data-emit-metadata": "0",
        "data-input-position": giscus.inputPosition,
        "data-theme": currentTheme(),
        "data-lang": giscus.lang,
        "data-loading": "lazy",
      };
      for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v);
      el.appendChild(script);

      const observer = new MutationObserver(() => {
        const iframe = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
        iframe?.contentWindow?.postMessage(
          { giscus: { setConfig: { theme: currentTheme() } } },
          "https://giscus.app",
        );
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

      return () => {
        observer.disconnect();
        el.innerHTML = "";
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useTwikoo, useGiscus]);

  if (!useTwikoo && !useGiscus) {
    return (
      <p className="mt-14 text-center text-[0.85rem] text-[var(--ink-faint)]">评论未开启</p>
    );
  }

  return <div ref={holder} className="mt-14" />;
}