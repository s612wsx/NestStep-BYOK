"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import type { RepairTriageResponse } from "@/app/lib/repairs-types";
import { TriageSections, SECTION_TITLES } from "./triage-sections";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:focus:ring-stone-800";

const CATEGORIES = [
  "漏水",
  "跳電 / 沒電",
  "停水",
  "馬桶堵塞",
  "排水不通",
  "冷氣異常",
  "熱水器異常",
  "冰箱不冷",
  "瓦斯有異味",
  "門鎖 / 鑰匙問題",
  "其他",
];

type Status = "idle" | "loading" | "done" | "error";

export function RepairsForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<RepairTriageResponse | null>(null);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData();
    data.set("category", category);
    data.set("description", description);
    if (image) data.set("image", image);

    setStatus("loading");
    setErrorMsg("");
    setResult(null);

    try {
      const res = await fetch("/api/repairs/triage", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || `伺服器回應 ${res.status}`);
      }
      setResult(json as RepairTriageResponse);
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
    setCategory("");
    setDescription("");
    setImage(null);
  };

  if (status === "loading") {
    return <LoadingView />;
  }

  if (status === "done" && result) {
    return <TriageView result={result} onReset={reset} />;
  }

  const canSubmit =
    category !== "" && (description.trim() !== "" || image !== null);

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
        <legend className="text-sm font-medium">問題類型</legend>
        <p className="mt-1 text-xs text-stone-500">選一個最接近的。</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <button
                type="button"
                key={c}
                onClick={() => setCategory(c)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-amber-700 bg-amber-700 text-white dark:border-amber-500 dark:bg-amber-500 dark:text-stone-900"
                    : "border-stone-300 text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-500"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="rp-desc" className="text-sm font-medium">
          描述問題
          <span className="ml-1 font-normal text-stone-400">
            （沒有照片時必填）
          </span>
        </label>
        <p className="mt-1 text-xs text-stone-500">
          什麼時候開始、多嚴重、有沒有聲音或氣味、你已經試過什麼。
        </p>
        <textarea
          id="rp-desc"
          name="description"
          rows={6}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="例如：昨天晚上開始，廚房天花板角落一直在滴水，臉盆一小時大概接半杯……"
          className={`mt-2 resize-y ${inputClass}`}
        />
      </div>

      <div>
        <span className="text-sm font-medium">
          上傳照片
          <span className="ml-1 font-normal text-stone-400">（選填）</span>
        </span>
        <p className="mt-1 text-xs text-stone-500">
          拍下漏水位置、電箱、面板或損壞處。單張、8MB 以內。AI
          會直接看這張照片，照片也會存起來附在事件上。
        </p>
        <label
          htmlFor="rp-image"
          className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500 transition-colors hover:border-stone-400 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
        >
          <span aria-hidden className="text-lg">
            ＋
          </span>
          <span>點這裡選擇照片</span>
          <input
            id="rp-image"
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
          disabled={!canSubmit}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-stone-900 px-5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-60 sm:w-auto dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
        >
          送出並分診
        </button>
      </div>
    </form>
  );
}

// ── loading ───────────────────────────────────────────────────

function LoadingView() {
  return (
    <div className="space-y-7" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="size-2 animate-pulse rounded-full bg-amber-600 dark:bg-amber-500"
        />
        <p className="text-sm text-stone-600 dark:text-stone-300">
          AI 正在做初步分診，通常需要十幾秒到半分鐘…
        </p>
      </div>

      <div className="h-16 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />

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

function TriageView({
  result,
  onReset,
}: {
  result: RepairTriageResponse;
  onReset: () => void;
}) {
  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">初步分診結果</h2>
          <p className="mt-1 text-xs text-stone-500">
            {result.category} ·{" "}
            {result.saved ? "已建立待處理事件" : "這次未能存進紀錄"}
            {result.createdAt
              ? ` · ${new Date(result.createdAt).toLocaleString("zh-TW")}`
              : ""}
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

      <TriageSections result={result.triage} />

      {result.saved && result.id && (
        <Link
          href={`/repairs/${result.id}`}
          className="inline-flex text-sm text-stone-900 underline underline-offset-2 dark:text-stone-100"
        >
          查看事件詳情 / 之後補充處理結果 →
        </Link>
      )}
    </div>
  );
}
