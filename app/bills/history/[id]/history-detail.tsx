"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BillAnalysisSections } from "@/app/bills/analysis-sections";
import {
  BILL_INPUT_TYPE_LABEL,
  type BillHistoryDetail,
} from "@/app/lib/bill-analysis-types";

type State = "loading" | "ready" | "unauth" | "notfound" | "error";

const backLink = (
  <Link
    href="/bills/history"
    className="inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-900 dark:hover:text-white"
  >
    <span aria-hidden>←</span> 帳單分析紀錄
  </Link>
);

export function BillHistoryDetailView({ id }: { id: string }) {
  const [state, setState] = useState<State>("loading");
  const [data, setData] = useState<BillHistoryDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/bills/history/${id}`)
      .then(async (res) => {
        if (res.status === 401) {
          if (!cancelled) setState("unauth");
          return;
        }
        if (res.status === 404) {
          if (!cancelled) setState("notfound");
          return;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "讀取失敗");
        if (!cancelled) {
          setData(json as BillHistoryDetail);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state !== "ready" || !data) {
    return (
      <div className="space-y-4">
        {backLink}
        {state === "loading" && (
          <p className="text-sm text-stone-500">載入中…</p>
        )}
        {state === "unauth" && (
          <p className="text-sm text-stone-600 dark:text-stone-300">
            請先{" "}
            <Link
              href="/login"
              className="text-stone-900 underline underline-offset-2 dark:text-stone-100"
            >
              登入
            </Link>
            。
          </p>
        )}
        {state === "notfound" && (
          <p className="text-sm text-stone-600 dark:text-stone-300">
            找不到這筆紀錄，或它不屬於你的帳號。
          </p>
        )}
        {state === "error" && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            讀取時發生問題，請稍後再試。
          </p>
        )}
      </div>
    );
  }

  const period =
    data.billingStartDate && data.billingEndDate
      ? `${data.billingStartDate} ~ ${data.billingEndDate}`
      : data.billingStartDate || data.billingEndDate || null;

  return (
    <div className="space-y-7">
      {backLink}

      <div>
        <h2 className="text-lg font-semibold tracking-tight">{data.title}</h2>
        <p className="mt-1 text-xs text-stone-500">
          {data.billType} ·{" "}
          {BILL_INPUT_TYPE_LABEL[data.inputType] ?? data.inputType} ·{" "}
          {new Date(data.createdAt).toLocaleString("zh-TW")}
        </p>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>
          <span className="text-stone-500">本期金額：</span>
          {data.amount !== null ? (
            <span className="font-medium tabular-nums">
              {data.amount.toLocaleString("zh-TW")} 元
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

      {data.fileUrl && (
        <a
          href={data.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-amber-800 underline underline-offset-2 dark:text-amber-400"
        >
          <span aria-hidden>📎</span>
          {data.fileName || "已上傳的檔案"}
        </a>
      )}

      {data.originalText && (
        <section>
          <h3 className="border-b border-stone-200 pb-1.5 text-sm font-semibold dark:border-stone-800">
            原始內容
          </h3>
          <p className="mt-2.5 max-h-64 overflow-y-auto whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700 dark:text-stone-300">
            {data.originalText}
          </p>
        </section>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold">分析結果</h3>
        <BillAnalysisSections result={data.analysisResult} />
      </div>
    </div>
  );
}
