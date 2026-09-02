"use client";

import { useSyncExternalStore } from "react";

/**
 * BYOK：使用者的 OpenAI API 金鑰只存在這台裝置的瀏覽器 localStorage。
 * NestStep 的伺服器不會儲存、不會記錄，只有送分析請求時才夾帶在 header 轉給 OpenAI。
 */
export const OPENAI_KEY_STORAGE = "neststep_openai_key";

/** 送 API 時夾帶金鑰用的 header 名稱（與伺服器端 OPENAI_KEY_HEADER 一致）*/
export const OPENAI_KEY_HEADER = "x-openai-key";

/** 金鑰變動時廣播，讓同分頁的其他元件即時更新 */
const KEY_CHANGE_EVENT = "neststep:openai-key-change";

/** 直接讀目前存的金鑰（沒有就回空字串）。localStorage 可能被停用，包 try/catch。*/
export function getStoredOpenAiKey(): string {
  try {
    return localStorage.getItem(OPENAI_KEY_STORAGE)?.trim() ?? "";
  } catch {
    return "";
  }
}

/** 存金鑰（只寫入這台裝置的瀏覽器）*/
export function setStoredOpenAiKey(key: string): void {
  try {
    localStorage.setItem(OPENAI_KEY_STORAGE, key.trim());
    window.dispatchEvent(new Event(KEY_CHANGE_EVENT));
  } catch {
    // 瀏覽器停用 localStorage 時忽略
  }
}

/** 移除金鑰 */
export function clearStoredOpenAiKey(): void {
  try {
    localStorage.removeItem(OPENAI_KEY_STORAGE);
    window.dispatchEvent(new Event(KEY_CHANGE_EVENT));
  } catch {
    // 同上
  }
}

/** 把金鑰遮成 sk-…abcd 方便顯示 */
export function maskApiKey(key: string): string {
  const k = key.trim();
  if (k.length <= 12) return "已設定";
  return `${k.slice(0, 6)}…${k.slice(-4)}`;
}

export type ByokKeyState = {
  /** 目前存的金鑰；未載入或未設定時為空字串 */
  apiKey: string;
  /** 是否已設定金鑰 */
  hasKey: boolean;
  /** 是否已在瀏覽器端完成 hydration（避免 SSR / 首次 render 閃動）*/
  loaded: boolean;
};

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(KEY_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(KEY_CHANGE_EVENT, callback);
  };
}

/**
 * 讀取目前的 BYOK 金鑰狀態，並在金鑰變動 / 切換分頁時自動更新。
 * 用 useSyncExternalStore 直接同步 localStorage，SSR 時回傳空字串、
 * `loaded` 為 false；hydration 後才變成實際值，避免 hydration mismatch。
 * `loaded` 為 false 前不要拿 `hasKey` 來擋 UI。
 */
export function useOpenAiKey(): ByokKeyState {
  const apiKey = useSyncExternalStore(
    subscribe,
    getStoredOpenAiKey,
    () => "",
  );
  const loaded = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return { apiKey, hasKey: apiKey.length > 0, loaded };
}
