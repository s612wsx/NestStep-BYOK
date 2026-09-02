"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BILL_INPUT_TYPE_LABEL,
  type BillHistoryItem,
} from "@/app/lib/bill-analysis-types";

type State = "loading" | "ready" | "unauth" | "error";

export function BillsHistoryList() {
  const [state, setState] = useState<State>("loading");
  const [items, setItems] = useState<BillHistoryItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; msg: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bills/history")
      .then(async (res) => {
        if (res.status === 401) {
          if (!cancelled) setState("unauth");
          return;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "讀取失敗");
        if (!cancelled) {
          setItems(json.items ?? []);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !window.confirm("確定要刪除這筆帳單分析嗎？連同上傳的檔案一起刪除，無法復原。")
    ) {
      return;
    }
    setDeletingId(id);
    setRowError(null);
    try {
      const res = await fetch(`/api/bills/history/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `伺服器回應 ${res.status}`);
      }
      setItems((cur) => cur.filter((item) => item.id !== id));
    } catch (err) {
      setRowError({
        id,
        msg: err instanceof Error ? err.message : "刪除失敗，請稍後再試",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (state === "loading") {
    return <p className="text-sm text-stone-500">載入中…</p>;
  }

  if (state === "unauth") {
    return (
      <p className="text-sm text-stone-600 dark:text-stone-300">
        請先{" "}
        <Link
          href="/login"
          className="text-stone-900 underline underline-offset-2 dark:text-stone-100"
        >
          登入
        </Link>{" "}
        才能看自己的帳單分析紀錄。
      </p>
    );
  }

  if (state === "error") {
    return (
      <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
        讀取歷史紀錄時發生問題，請稍後再試。
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        還沒有任何帳單分析。{" "}
        <Link
          href="/bills"
          className="text-stone-900 underline underline-offset-2 dark:text-stone-100"
        >
          去分析一張
        </Link>
      </p>
    );
  }

  return (
    <ul className="border-t border-stone-200 dark:border-stone-800">
      {items.map((item) => {
        const deleting = deletingId === item.id;
        return (
          <li
            key={item.id}
            className="border-b border-stone-200 dark:border-stone-800"
          >
            <div className="flex items-center gap-1">
              <Link
                href={`/bills/history/${item.id}`}
                className="group flex min-w-0 flex-1 items-center gap-4 rounded-md px-1 py-4 transition-colors hover:bg-stone-100 dark:hover:bg-stone-900"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-stone-500">
                    {new Date(item.createdAt).toLocaleString("zh-TW")} ·{" "}
                    {item.billType} ·{" "}
                    {BILL_INPUT_TYPE_LABEL[item.inputType] ?? item.inputType}
                    {item.amount !== null
                      ? ` · ${item.amount.toLocaleString("zh-TW")} 元`
                      : ""}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={deleting}
                aria-label={`刪除「${item.title}」`}
                className="shrink-0 rounded-md px-2.5 py-1.5 text-xs text-stone-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-60 dark:hover:bg-red-950/40 dark:hover:text-red-300"
              >
                {deleting ? "刪除中…" : "刪除"}
              </button>
            </div>
            {rowError?.id === item.id && (
              <p
                role="alert"
                className="px-1 pb-3 text-xs text-red-700 dark:text-red-300"
              >
                {rowError.msg}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
