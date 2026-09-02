"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RepairEventListItem } from "@/app/lib/repairs-types";
import { STATUS_LABEL, STATUS_BADGE } from "@/app/repairs/status";

type State = "loading" | "ready" | "unauth" | "error";

export function RepairsEventsList() {
  const [state, setState] = useState<State>("loading");
  const [items, setItems] = useState<RepairEventListItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; msg: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/repairs")
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
      !window.confirm("確定要刪除這筆事件嗎？連同上傳的照片一起刪除，無法復原。")
    ) {
      return;
    }
    setDeletingId(id);
    setRowError(null);
    try {
      const res = await fetch(`/api/repairs/${id}`, { method: "DELETE" });
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
        才能看自己的事件紀錄。
      </p>
    );
  }

  if (state === "error") {
    return (
      <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
        讀取事件紀錄時發生問題，請稍後再試。
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        還沒有任何事件。{" "}
        <Link
          href="/repairs"
          className="text-stone-900 underline underline-offset-2 dark:text-stone-100"
        >
          回報一個問題
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
                href={`/repairs/${item.id}`}
                className="group flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-4 transition-colors hover:bg-stone-100 dark:hover:bg-stone-900"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium">{item.category}</span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${
                        STATUS_BADGE[item.status] ?? "border-stone-300"
                      }`}
                    >
                      {STATUS_LABEL[item.status] ?? item.status}
                    </span>
                    {item.hasPhoto && (
                      <span
                        aria-label="有照片"
                        className="shrink-0 text-xs text-stone-400"
                      >
                        📎
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-sm text-stone-500">
                    {new Date(item.createdAt).toLocaleString("zh-TW")}
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
                aria-label={`刪除「${item.category}」`}
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
