"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  BILL_TYPES,
  BILL_INPUT_TYPE_LABEL,
  type BillAnalyzeResponse,
} from "@/app/lib/bill-analysis-types";
import { useOpenAiKey, OPENAI_KEY_HEADER } from "@/app/lib/openai-key";
import { useAuthUser } from "@/app/lib/use-auth-user";
import { ApiKeyNotice } from "@/components/api-key-notice";
import { BillAnalysisSections, SECTION_TITLES } from "./analysis-sections";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:focus:ring-stone-800";

type Status = "idle" | "loading" | "done" | "error";

export function BillsForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<BillAnalyzeResponse | null>(null);
  const [billType, setBillType] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { apiKey, hasKey, loaded } = useOpenAiKey();
  const { user, authLoaded } = useAuthUser();
  const needLogin = authLoaded && !user;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("billType", billType);
    if (file) {
      data.set("file", file);
    } else {
      data.delete("file");
    }

    setStatus("loading");
    setErrorMsg("");
    setResult(null);

    try {
      const res = await fetch("/api/bills/analyze", {
        method: "POST",
        headers: { [OPENAI_KEY_HEADER]: apiKey },
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || `伺服器回應 ${res.status}`);
      }
      setResult(json as BillAnalyzeResponse);
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
    setBillType("");
    setContent("");
    setFile(null);
  };

  if (status === "loading") {
    return <LoadingView hasFile={Boolean(file)} />;
  }

  if (status === "done" && result) {
    return <AnalysisView result={result} onReset={reset} />;
  }

  const canSubmit =
    billType !== "" && (content.trim().length >= 10 || file !== null);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {errorMsg}
          <span className="mt-1 block text-red-700/80 dark:text-red-300/70">
            剛才填的內容還在，可以直接再送出一次。
          </span>
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-medium">帳單類型</legend>
        <p className="mt-1 text-xs text-stone-500">選一個最接近的。</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {BILL_TYPES.map((t) => {
            const active = billType === t;
            return (
              <button
                type="button"
                key={t}
                onClick={() => setBillType(t)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-amber-700 bg-amber-700 text-white dark:border-amber-500 dark:bg-amber-500 dark:text-stone-900"
                    : "border-stone-300 text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-500"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="bill-title" className="text-sm font-medium">
          標題
          <span className="ml-1 font-normal text-stone-400">
            （選填，留空的話 AI 會自己下標題）
          </span>
        </label>
        <input
          id="bill-title"
          name="title"
          type="text"
          placeholder="例如：8 月電費單"
          className={`mt-2 ${inputClass}`}
        />
      </div>

      <div>
        <label htmlFor="bill-content" className="text-sm font-medium">
          貼上帳單文字
          <span className="ml-1 font-normal text-stone-400">
            （沒有上傳檔案時必填）
          </span>
        </label>
        <p className="mt-1 text-xs text-stone-500">
          把帳單上的項目與金額打上來，或上傳 PDF / 圖片（這裡就可以留空）。
        </p>
        <textarea
          id="bill-content"
          name="content"
          rows={9}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="例如：計費期間 7/1–8/31，本期電費 1,250 元，基本電費 75 元，流動電費 1,120 元……"
          className={`mt-2 resize-y ${inputClass}`}
        />
      </div>

      <div>
        <span className="text-sm font-medium">
          上傳 PDF / 圖片
          <span className="ml-1 font-normal text-stone-400">（選填）</span>
        </span>
        <p className="mt-1 text-xs text-stone-500">
          PDF 或帳單照片，單一檔案、8MB 以內。AI 會直接讀這份檔案，也會存起來。照片請盡量清晰、字看得清楚。
        </p>
        <label
          htmlFor="bill-file"
          className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500 transition-colors hover:border-stone-400 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
        >
          <span aria-hidden className="text-lg">
            ＋
          </span>
          <span>點這裡選擇 PDF 或圖片</span>
          <input
            id="bill-file"
            name="file"
            type="file"
            accept="application/pdf,image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
        {file && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-stone-200 px-3 py-2 text-sm dark:border-stone-800">
            <span className="min-w-0 truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
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
          disabled={!canSubmit || (loaded && !hasKey) || needLogin}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-stone-900 px-5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-60 sm:w-auto dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
        >
          {needLogin
            ? "請先登入或註冊"
            : loaded && !hasKey
              ? "設定金鑰後才能用"
              : "幫我看懂帳單"}
        </button>
        <ApiKeyNotice hasKey={hasKey} loaded={loaded} needLogin={needLogin} />
      </div>
    </form>
  );
}

// ── loading ───────────────────────────────────────────────────

function LoadingView({ hasFile }: { hasFile: boolean }) {
  return (
    <div className="space-y-7" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="size-2 animate-pulse rounded-full bg-amber-600 dark:bg-amber-500"
        />
        <p className="text-sm text-stone-600 dark:text-stone-300">
          {hasFile ? "正在上傳檔案並請 AI 閱讀帳單" : "AI 正在閱讀帳單內容"}
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

function AnalysisView({
  result,
  onReset,
}: {
  result: BillAnalyzeResponse;
  onReset: () => void;
}) {
  const period =
    result.billingStartDate && result.billingEndDate
      ? `${result.billingStartDate} ~ ${result.billingEndDate}`
      : result.billingStartDate || result.billingEndDate || null;

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{result.title}</h2>
          <p className="mt-1 text-xs text-stone-500">
            {result.billType} ·{" "}
            {BILL_INPUT_TYPE_LABEL[result.inputType] ?? result.inputType} · 已存檔{" "}
            {new Date(result.createdAt).toLocaleString("zh-TW")}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-sm transition-colors hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
        >
          看另一張
        </button>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>
          <span className="text-stone-500">本期金額：</span>
          {result.amount !== null ? (
            <span className="font-medium tabular-nums">
              {result.amount.toLocaleString("zh-TW")} 元
            </span>
          ) : (
            <span className="text-stone-400">帳單中無法可靠取得</span>
          )}
        </span>
        <span>
          <span className="text-stone-500">計費期間：</span>
          {period ? (
            <span className="font-medium">{period}</span>
          ) : (
            <span className="text-stone-400">帳單中無法可靠取得</span>
          )}
        </span>
      </div>

      {result.file && (
        <a
          href={result.file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-amber-800 underline underline-offset-2 dark:text-amber-400"
        >
          <span aria-hidden>📎</span>
          {result.file.fileName}
        </a>
      )}

      <BillAnalysisSections result={result.analysisResult} />

      {result.id && (
        <Link
          href={`/bills/history/${result.id}`}
          className="inline-flex text-sm text-stone-900 underline underline-offset-2 dark:text-stone-100"
        >
          查看這筆紀錄詳情 →
        </Link>
      )}
    </div>
  );
}
