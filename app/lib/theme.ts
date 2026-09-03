/** 主題偏好：只存在這台裝置的瀏覽器 localStorage。*/
export const THEME_STORAGE = "neststep_theme";

/** light / dark 為手動指定；system 跟隨作業系統的 prefers-color-scheme。*/
export type Theme = "light" | "dark" | "system";

export const THEME_ORDER: Theme[] = ["light", "dark", "system"];

export const THEME_LABEL: Record<Theme, string> = {
  light: "淺色",
  dark: "深色",
  system: "跟隨系統",
};

/** 把選擇寫到 <html data-theme>，globals.css 會據此決定要不要套深色。*/
export function applyTheme(theme: Theme): void {
  try {
    document.documentElement.setAttribute("data-theme", theme);
  } catch {
    // 存取受限時忽略
  }
}

/** 讀目前存的偏好；沒有或不合法時回 "system"。*/
export function getStoredTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_STORAGE);
    if (t === "light" || t === "dark" || t === "system") return t;
  } catch {
    // ignore
  }
  return "system";
}

/**
 * 首次載入前（React hydrate 之前）就要跑，避免閃一下白／黑。
 * 這段字串會被 inline 進 <body> 最前面同步執行，所以不能依賴任何 import。
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE}");document.documentElement.setAttribute("data-theme",t==="light"||t==="dark"?t:"system")}catch(e){}`;
