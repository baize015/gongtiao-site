export const THEME_STORAGE_KEY = "gongtiao-theme";

/**
 * 在 <head> 里同步执行，避免深色模式闪白。
 * 逻辑：先看本地存储，再看系统偏好。
 *
 * 同时写两处标记：
 * - data-theme="dark"：本站自己的 CSS 变量靠它切换；
 * - class="dark"：从原模板移植过来的组件用的是 Tailwind 的 dark: 变体。
 */
export const themeInitScript = `(function(){try{var k="${THEME_STORAGE_KEY}";var s=localStorage.getItem(k);var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var el=document.documentElement;el.dataset.theme=d?"dark":"light";if(d){el.classList.add("dark");}else{el.classList.remove("dark");}}catch(e){}})();`;

/** 切换主题时保持两个标记同步 */
export const applyTheme = (dark: boolean) => {
  const el = document.documentElement;
  el.dataset.theme = dark ? "dark" : "light";
  el.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    /* 隐私模式下忽略 */
  }
};
