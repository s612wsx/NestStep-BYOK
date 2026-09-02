"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import type { DocumentAnalyzeResponse } from "@/app/lib/document-analysis-types";
import { useOpenAiKey, OPENAI_KEY_HEADER } from "@/app/lib/openai-key";
import { useAuthUser } from "@/app/lib/use-auth-user";
import { ApiKeyNotice } from "@/components/api-key-notice";
import { DocumentAnalysisSections, SECTION_TITLES } from "./analysis-sections";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:focus:ring-stone-800";

type Status = "idle" | "loading" | "done" | "error";

export function DocumentsForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<DocumentAnalyzeResponse | null>(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { apiKey, hasKey, loaded } = useOpenAiKey();
  const { user, authLoaded } = useAuthUser();
  const needLogin = authLoaded && !user;

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
      const res = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { [OPENAI_KEY_HEADER]: apiKey },
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || `伺服器回應 ${res.status}`);
      }
      setResult(json as DocumentAnalyzeResponse);
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
        <label htmlFor="doc-title" className="text-sm font-medium">
          文件標題
          <span className="ml-1 font-normal text-stone-400">
            （選填，留空的話 AI 會自己下標題）
          </span>
        </label>
        <input
          id="doc-title"
          name="title"
          type="text"
          placeholder="例如：中華電信 4G 上網方案合約"
          className={`mt-2 ${inputClass}`}
        />
      </div>

      <div>
        <label htmlFor="doc-content" className="text-sm font-medium">
          貼上文字內容
          <span className="ml-1 font-normal text-stone-400">
            （沒有上傳 PDF 時必填）
          </span>
        </label>
        <p className="mt-1 text-xs text-stone-500">
          租約、電信 / 網路合約、管理規約、維修報價單、保固條款等。上傳 PDF
          的話這裡可以留空。
        </p>
        <textarea
          id="doc-content"
          name="content"
          rows={10}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="把文件內容貼上來……"
          className={`mt-2 resize-y ${inputClass}`}
        />
      </div>

      <div>
        <span className="text-sm font-medium">
          上傳 PDF
          <span className="ml-1 font-normal text-stone-400">（選填）</span>
        </span>
        <p className="mt-1 text-xs text-stone-500">
          只接受 PDF，單一檔案、8MB 以內。AI 會直接讀這份 PDF，檔案也會存起來。
        </p>
        <label
          htmlFor="doc-file"
          className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500 transition-colors hover:border-stone-400 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
        >
          <span aria-hidden className="text-lg">
            ＋
          </span>
          <span>點這裡選擇 PDF</span>
          <input
            id="doc-file"
            name="file"
            type="file"
            accept="application/pdf"
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
          disabled={
            (content.trim().length < 10 && !file) ||
            (loaded && !hasKey) ||
            needLogin
          }
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-stone-900 px-5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-60 sm:w-auto dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
        >
          {needLogin
            ? "請先登入或註冊"
            : loaded && !hasKey
              ? "設定金鑰後才能用"
              : "幫我看懂"}
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
          {hasFile ? "正在上傳 PDF 並請 AI 閱讀" : "AI 正在閱讀文件內容"}
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
  result: DocumentAnalyzeResponse;
  onReset: () => void;
}) {
  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{result.title}</h2>
          <p className="mt-1 text-xs text-stone-500">
            {result.documentType && `${result.documentType} · `}
            {result.inputType === "pdf" ? "PDF" : "貼上文字"} · 已存檔{" "}
            {new Date(result.createdAt).toLocaleString("zh-TW")}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-sm transition-colors hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
        >
          看另一份
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
        </a>
      )}

      <DocumentAnalysisSections result={result.analysisResult} />

      {result.id && (
        <Link
          href={`/documents/history/${result.id}`}
          className="inline-flex text-sm text-stone-900 underline underline-offset-2 dark:text-stone-100"
        >
          查看這筆紀錄詳情 →
        </Link>
      )}
    </div>
  );
}
