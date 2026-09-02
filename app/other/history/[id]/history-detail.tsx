"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GuidanceSections } from "@/app/other/guidance-sections";
import type { LifeQueryHistoryDetail } from "@/app/lib/life-query-types";

type State = "loading" | "ready" | "unauth" | "notfound" | "error";

const backLink = (
  <Link
    href="/other/history"
    className="inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-900 dark:hover:text-white"
  >
    <span aria-hidden>←</span> 生活問題紀錄
  </Link>
);

export function OtherHistoryDetailView({ id }: { id: string }) {
  const [state, setState] = useState<State>("loading");
  const [data, setData] = useState<LifeQueryHistoryDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/other/history/${id}`)
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
          setData(json as LifeQueryHistoryDetail);
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

  return (
    <div className="space-y-7">
      {backLink}

      <div>
        <p className="text-xs text-stone-500">
          {new Date(data.createdAt).toLocaleString("zh-TW")}
          {data.quickPrompt ? ` · ${data.quickPrompt}` : ""}
        </p>
      </div>

      <section>
        <h3 className="border-b border-stone-200 pb-1.5 text-sm font-semibold dark:border-stone-800">
          你的問題
        </h3>
        <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700 dark:text-stone-300">
          {data.description}
        </p>
      </section>

      {data.imageUrl && (
        <section>
          <h3 className="border-b border-stone-200 pb-1.5 text-sm font-semibold dark:border-stone-800">
            你上傳的照片
          </h3>
          <a
            href={data.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block w-fit"
          >
            {/* 使用者自己上傳的圖片，直接用 img 呈現 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.imageUrl}
              alt="使用者上傳的照片"
              className="max-h-96 rounded-lg border border-stone-200 dark:border-stone-800"
            />
          </a>
        </section>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold">導航結果</h3>
        <GuidanceSections
          detectedCategory={data.detectedCategory}
          guidance={data.aiGuidance}
        />
      </div>
    </div>
  );
}
