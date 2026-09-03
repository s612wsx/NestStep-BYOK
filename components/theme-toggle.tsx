"use client";

import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import {
  THEME_STORAGE,
  THEME_ORDER,
  THEME_LABEL,
  applyTheme,
  getStoredTheme,
  type Theme,
} from "@/app/lib/theme";

const SunIcon = (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </svg>
);

const MoonIcon = (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 14.3A8 8 0 0 1 9.7 4a7 7 0 1 0 10.3 10.3z" />
  </svg>
);

const SystemIcon = (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="12" rx="1.5" />
    <path d="M9 20h6M12 16v4" />
  </svg>
);

const ICON: Record<Theme, ReactNode> = {
  light: SunIcon,
  dark: MoonIcon,
  system: SystemIcon,
};

/** 主題偏好變動時廣播，讓同分頁的按鈕即時更新 */
const THEME_CHANGE_EVENT = "neststep:theme-change";

function subscribe(callback: () => void): () => void {
  // 別的分頁改了偏好 → 先把這個分頁的 <html data-theme> 同步過來，再觸發重繪
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE) applyTheme(getStoredTheme());
    callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

/** 直接讀 <html data-theme>（首次載入時已由 THEME_INIT_SCRIPT 設好）*/
function getSnapshot(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" || attr === "dark" ? attr : "system";
}

function getServerSnapshot(): Theme {
  return "system";
}

/**
 * 淺 / 深 / 跟隨系統 三態循環切換，選擇存在 localStorage。
 * 首次載入的套用由 app/lib/theme 的 THEME_INIT_SCRIPT 在 hydrate 前處理，
 * 這裡只負責顯示目前狀態與切換。
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const nextIndex = (THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length;
  const next = THEME_ORDER[nextIndex];

  const cycle = () => {
    try {
      localStorage.setItem(THEME_STORAGE, next);
    } catch {
      // ignore
    }
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`主題：${THEME_LABEL[theme]}，點擊改為${THEME_LABEL[next]}`}
      title={`主題：${THEME_LABEL[theme]}`}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-stone-600 transition-colors hover:bg-stone-200/70 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
    >
      {ICON[theme]}
    </button>
  );
}
