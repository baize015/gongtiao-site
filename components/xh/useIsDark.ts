"use client";

import { useEffect, useState } from "react";
import { applyTheme } from "@/lib/theme";

/**
 * 只读订阅「当前是不是深色」，不自己碰 localStorage。
 *
 * 站点主题由 `lib/theme.ts` 维护，会同时写两处标记：
 * - `<html data-theme="dark|light">`（本站 CSS 变量用）
 * - `<html class="dark">`（Tailwind dark: 变体用）
 *
 * 这里用 MutationObserver 盯住这两个属性，所以不管是主题脚本、本站 Nav
 * 还是 ThemeToggleBlock 改了主题，订阅者都能立刻收到。
 */
export function useIsDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    const read = () => {
      const attr = root.dataset.theme;
      if (attr === "dark") return true;
      if (attr === "light") return false;
      return root.classList.contains("dark");
    };

    const sync = () => setIsDark(read());
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

/** 主题切换：统一走 lib/theme 的 applyTheme，两处标记一起改。 */
export function useToggleTheme() {
  const isDark = useIsDark();
  return () => applyTheme(!isDark);
}
