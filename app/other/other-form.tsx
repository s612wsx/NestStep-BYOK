"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  QUICK_PROMPTS,
  type LifeQueryResponse,
} from "@/app/lib/life-query-types";
import { useOpenAiKey, OPENAI_KEY_HEADER } from "@/app/lib/openai-key";
import { useAuthUser } from "@/app/lib/use-auth-user";
import { ApiKeyNotice } from "@/components/api-key-notice";
import { GuidanceSections, SECTION_TITLES } from "./guidance-sections";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:focus:ring-stone-800";

type Status = "idle" | "loading" | "done" | "error";

export function OtherForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<LifeQueryResponse | null>(null);
  const [quickPrompt, setQuickPrompt] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const { apiKey, hasKey, loaded } = useOpenAiKey();
  const { user, authLoaded } = useAuthUser();
  const needLogin = authLoaded && !user;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData();
    data.set("description", description);
    data.set("quickPrompt", quickPrompt);
    if (image) data.set("image", image);

    setStatus("loading");
    setErrorMsg("");
    setResult(null);

    try {
      const res = await fetch("/api/other/analyze", {
        method: "POST",
        headers: { [OPENAI_KEY_HEADER]: apiKey },
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || `伺服器回應 ${res.status}`);
      }
      setResult(json as LifeQueryResponse);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "送出失敗，請稍後再試");
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setErrorMsg("");
    setResult(null);
    setQuickPrompt("");
    setDescription("");
    setImage(null);
  };

  if (status === "loading") {
    return <LoadingView hasImage={Boolean(image)} />;
  }

  if (status === "done" && result) {
    return <GuidanceView result={result} onReset={reset} />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {errorMsg}
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-medium">
          最接近的狀況
          <span className="ml-1 font-normal text-stone-400">（選填）</span>
        </legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((q) => {
            const active = quickPrompt === q;
            return (
              <button
                type="button"
                key={q}
                onClick={() => setQuickPrompt(active ? "" : q)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-amber-700 bg-amber-700 text-white dark:border-amber-500 dark:bg-amber-500 dark:text-stone-900"
                    : "border-stone-300 text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-500"
                }`}
              >
                {q}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="other-desc" className="text-sm font-medium">
          描述你遇到的問題
        </label>
        <p className="mt-1 text-xs text-stone-500">
          發生什麼事、你已經試過什麼、卡在哪裡。
        </p>
        <textarea
          id="other-desc"
          name="description"
          rows={7}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="例如：牆上有一個白色盒子，上面有按鈕和數字在跳，不知道是什麼，也不知道能不能動它……"
          className={`mt-2 resize-y ${inputClass}`}
        />
      </div>

      <div>
        <span className="text-sm font-medium">
          上傳一張照片
          <span className="ml-1 font-normal text-stone-400">（選填）</span>
        </span>
        <p className="mt-1 text-xs text-stone-500">
          拍下你不確定的東西或狀況。單張、8MB 以內。AI 會直接看這張照片。
        </p>
        <label
          htmlFor="other-image"
          className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500 transition-colors hover:border-stone-400 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
        >
          <span aria-hidden className="text-lg">
            ＋
          </span>
          <span>點這裡選擇照片</span>
          <input
            id="other-image"
            name="image"
            type="file"
            accept="image/*"
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
        {image && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-stone-200 px-3 py-2 text-sm dark:border-stone-800">
            <span className="min-w-0 truncate">{image.name}</span>
            <button
              type="button"
              onClick={() => setImage(null)}
              className="shrink-0 text-xs text-stone-500 transition-colors hover:text-stone-900 dark:hover:text-white"
            >
              移除
            </button>
          </div>
        )}
      </div>

      <div className="pt-1">
        <button
          type="submit"
          disabled={
            description.trim().length < 5 || (loaded && !hasKey) || needLogin
          }
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-stone-900 px-5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-60 sm:w-auto dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
        >
          {needLogin
            ? "請先登入或註冊"
            : loaded && !hasKey
              ? "設定金鑰後才能用"
              : "送出問題"}
        </button>
        <ApiKeyNotice hasKey={hasKey} loaded={loaded} needLogin={needLogin} />
      </div>
    </form>
  );
}

// ── loading ───────────────────────────────────────────────────

function LoadingView({ hasImage }: { hasImage: boolean }) {
  return (
    <div className="space-y-7" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="size-2 animate-pulse rounded-full bg-amber-600 dark:bg-amber-500"
        />
        <p className="text-sm text-stone-600 dark:text-stone-300">
          {hasImage ? "正在上傳照片並請 AI 判斷" : "AI 正在幫你判斷這個問題"}
          ，通常需要十幾秒到半分鐘…
        </p>
      </div>

      {SECTION_TITLES.map((title) => (
        <section key={title}>
          <div className="border-b border-stone-200 pb-1.5 dark:border-stone-800">
            <h3 className="text-sm font-semibold text-stone-400">{title}</h3>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
          </div>
        </section>
      ))}
    </div>
  );
}

// ── success ───────────────────────────────────────────────────

function GuidanceView({
  result,
  onReset,
}: {
  result: LifeQueryResponse;
  onReset: () => void;
}) {
  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">問題導航結果</h2>
          <p className="mt-1 text-xs text-stone-500">
            已存檔 · {new Date(result.createdAt).toLocaleString("zh-TW")}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-sm transition-colors hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
        >
          再問一個
        </button>
      </div>

      {result.imageUrl && (
        <a
          href={result.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-amber-800 underline underline-offset-2 dark:text-amber-400"
        >
          <span aria-hidden>📎</span>
          你上傳的照片
        </a>
      )}

      <GuidanceSections
        detectedCategory={result.detectedCategory}
        guidance={result.aiGuidance}
      />

      {result.id && (
        <Link
          href={`/other/history/${result.id}`}
          className="inline-flex text-sm text-stone-900 underline underline-offset-2 dark:text-stone-100"
        >
          查看這筆紀錄詳情 →
        </Link>
      )}
    </div>
  );
}
