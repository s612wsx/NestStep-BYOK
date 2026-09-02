"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  useOpenAiKey,
  setStoredOpenAiKey,
  clearStoredOpenAiKey,
  maskApiKey,
  OPENAI_KEY_HEADER,
} from "@/app/lib/openai-key";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 font-mono text-[13px] outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:focus:ring-stone-800";

type Status = "idle" | "checking" | "saved" | "error";

export function SettingsForm() {
  const { apiKey, hasKey, loaded } = useOpenAiKey();
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const key = draft.trim();
    if (!key) return;

    setStatus("checking");
    setMessage("");
    try {
      const res = await fetch("/api/openai/validate", {
        method: "POST",
        headers: { [OPENAI_KEY_HEADER]: key },
      });
      const json = (await res.json()) as { valid?: boolean; error?: string };
      if (json.valid) {
        setStoredOpenAiKey(key);
        setDraft("");
        setStatus("saved");
        setMessage("金鑰有效，已儲存在這台裝置的瀏覽器。");
      } else {
        setStatus("error");
        setMessage(json.error || "金鑰驗證失敗，請再確認一次。");
      }
    } catch {
      setStatus("error");
      setMessage("驗證時發生問題，請稍後再試。");
    }
  };

  const onRemove = () => {
    clearStoredOpenAiKey();
    setStatus("idle");
    setMessage("已從這台裝置移除金鑰。");
  };

  return (
    <div className="space-y-8">
      {/* 目前狀態 */}
      <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
        <p className="text-sm font-medium">目前狀態</p>
        {!loaded ? (
          <p className="mt-1 text-sm text-stone-500">讀取中…</p>
        ) : hasKey ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm text-emerald-700 dark:text-emerald-400">
              ✓ 已設定金鑰
            </span>
            <span className="font-mono text-xs text-stone-500">
              {maskApiKey(apiKey)}
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-stone-500 underline underline-offset-2 transition-colors hover:text-stone-900 dark:hover:text-white"
            >
              移除金鑰
            </button>
          </div>
        ) : (
          <p className="mt-1 text-sm text-stone-500">
            尚未設定。設定後才能使用 AI 分析功能。
          </p>
        )}
      </div>

      {/* 貼上金鑰 */}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="openai-key" className="text-sm font-medium">
            {hasKey ? "更換金鑰" : "貼上你的 OpenAI API 金鑰"}
          </label>
          <p className="mt-1 text-xs text-stone-500">
            以 <code className="font-mono">sk-</code>{" "}
            開頭。可在 OpenAI 後台的 API keys 頁面建立。
          </p>
          <input
            id="openai-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="sk-..."
            className={`mt-2 ${inputClass}`}
          />
        </div>

        {message && (
          <p
            role={status === "error" ? "alert" : "status"}
            className={`rounded-lg border px-3 py-2 text-sm ${
              status === "error"
                ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={draft.trim() === "" || status === "checking"}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-stone-900 px-5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-60 sm:w-auto dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
        >
          {status === "checking" ? "驗證中…" : "驗證並儲存"}
        </button>
      </form>

      {/* 安心說明 */}
      <div className="rounded-lg bg-stone-100 p-4 text-[13px] leading-relaxed text-stone-600 dark:bg-stone-900 dark:text-stone-400">
        <p className="font-medium text-stone-700 dark:text-stone-300">
          你的金鑰怎麼被處理
        </p>
        <ul className="mt-2 space-y-1.5">
          <li className="flex gap-2">
            <span aria-hidden className="text-stone-400">
              •
            </span>
            金鑰只存在這台裝置的瀏覽器（localStorage）。NestStep
            的伺服器不會儲存，也不會寫進任何紀錄或 log。
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-stone-400">
              •
            </span>
            每次分析時，金鑰才會隨該次請求送到 NestStep
            伺服器，並直接轉給 OpenAI 使用，用完即丟。
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-stone-400">
              •
            </span>
            驗證只是拿金鑰呼叫一次 OpenAI 的 <code className="font-mono">/v1/models</code>
            ，確認金鑰有效，不會產生費用。
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-stone-400">
              •
            </span>
            換裝置或清除瀏覽器資料後需要重新貼上；不想再用時按「移除金鑰」即可。
          </li>
        </ul>
      </div>
    </div>
  );
}
