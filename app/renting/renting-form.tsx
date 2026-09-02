"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { RentingAnalyzeResponse } from "@/app/lib/renting-analysis-types";
import { AnalysisSections, SECTION_TITLES } from "./analysis-sections";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:focus:ring-stone-800";

type Status = "idle" | "loading" | "done" | "error";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function RentingForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<RentingAnalyzeResponse | null>(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (file) {
      data.set("file", file);
    } else {
      data.delete("file");
    }

    setStatus("loading");
    setErrorMsg("");
    setResult(null);

    try {
      const res = await fetch("/api/renting/analyze", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || `伺服器回應 ${res.status}`);
      }
      setResult(json as RentingAnalyzeResponse);
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
    setContent("");
    setFile(null);
  };

  if (status === "loading") {
    return <LoadingView hasFile={Boolean(file)} />;
  }

  if (status === "done" && result) {
    return <AnalysisView result={result} onReset={reset} />;
  }

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

      <div>
        <label htmlFor="rf-title" className="text-sm font-medium">
          物件標題
          <span className="ml-1 font-normal text-stone-400">（選填）</span>
        </label>
        <input
          id="rf-title"
          name="title"
          type="text"
          placeholder="例如：中正區 2 房 面公園"
          className={`mt-2 ${inputClass}`}
        />
      </div>

      <div>
        <label htmlFor="rf-url" className="text-sm font-medium">
          物件網址
          <span className="ml-1 font-normal text-stone-400">（選填）</span>
        </label>
        <p className="mt-1 text-xs text-stone-500">
          網址只是記錄用，系統不會（也無法）從網址抓取內文分析；請把要分析的內容複製到下方欄位。
        </p>
        <input
          id="rf-url"
          name="sourceUrl"
          type="url"
          inputMode="url"
          placeholder="https://"
          className={`mt-2 ${inputClass}`}
        />
      </div>

      <div>
        <label htmlFor="rf-content" className="text-sm font-medium">
          貼上文字內容
          <span className="ml-1 font-normal text-stone-400">
            （沒有上傳檔案時必填）
          </span>
        </label>
        <p className="mt-1 text-xs text-stone-500">
          租屋廣告、建案文案，或你自己整理的內容。如果直接上傳 PDF / 圖片，這裡可以留空。
        </p>
        <textarea
          id="rf-content"
          name="content"
          rows={10}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="例如：全新裝潢，近捷運，生活機能佳，租金premium價，可短期，車位可租（需另議），採光極佳……"
          className={`mt-2 resize-y ${inputClass}`}
        />
      </div>

      <div>
        <span className="text-sm font-medium">
          上傳 PDF / 圖片
          <span className="ml-1 font-normal text-stone-400">（選填）</span>
        </span>
        <p className="mt-1 text-xs text-stone-500">
          廣告截圖、平面圖或合約。單一檔案、8MB 以內。AI 會直接讀這個檔案的內容，檔案也會存到雲端保留。
        </p>
        <label
          htmlFor="rf-file"
          className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500 transition-colors hover:border-stone-400 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
        >
          <span aria-hidden className="text-lg">
            ＋
          </span>
          <span>點這裡選擇 PDF 或圖片</span>
          <input
            id="rf-file"
            name="file"
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
        {file && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-stone-200 px-3 py-2 text-sm dark:border-stone-800">
            <span className="min-w-0 truncate">
              {file.name}
              <span className="ml-2 text-xs text-stone-400">
                {formatBytes(file.size)}
              </span>
            </span>
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
          disabled={content.trim().length < 10 && !file}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-stone-900 px-5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-60 sm:w-auto dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
        >
          送出並分析
        </button>
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
          {hasFile ? "正在上傳檔案並請 AI 閱讀內容" : "AI 正在閱讀你的內容"}
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
  result: RentingAnalyzeResponse;
  onReset: () => void;
}) {
  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{result.title}</h2>
          <p className="mt-1 text-xs text-stone-500">
            已存檔 · {new Date(result.createdAt).toLocaleString("zh-TW")}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-sm transition-colors hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
        >
          分析另一份
        </button>
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
          <span className="text-stone-400 no-underline">
            （{formatBytes(result.file.size)}）
          </span>
        </a>
      )}

      <AnalysisSections result={result.analysisResult} />
    </div>
  );
}
