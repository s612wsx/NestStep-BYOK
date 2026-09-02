"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PHASES,
  type MovePlanDetail,
  type MoveChecklistItem,
  type MovePlanPatchAction,
  type PhaseKey,
} from "@/app/lib/move-plan-types";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:focus:ring-stone-800";

type LoadState = "loading" | "ready" | "unauth" | "notfound" | "error";

const backLink = (
  <Link
    href="/moving/plans"
    className="inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-900 dark:hover:text-white"
  >
    <span aria-hidden>←</span> 我的搬家計畫
  </Link>
);

export function MovePlanView({ id }: { id: string }) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [data, setData] = useState<MovePlanDetail | null>(null);

  const [busy, setBusy] = useState(false);
  const [patchError, setPatchError] = useState("");
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<number | undefined>(undefined);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [addingPhase, setAddingPhase] = useState<PhaseKey | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/moving/${id}`)
      .then(async (res) => {
        if (res.status === 401) {
          if (!cancelled) setLoadState("unauth");
          return;
        }
        if (res.status === 404) {
          if (!cancelled) setLoadState("notfound");
          return;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "讀取失敗");
        if (!cancelled) {
          setData(json as MovePlanDetail);
          setLoadState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  const flashSaved = () => {
    setSaved(true);
    window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSaved(false), 2000);
  };

  const patch = async (
    payload: MovePlanPatchAction,
  ): Promise<MovePlanDetail | null> => {
    setBusy(true);
    setPatchError("");
    try {
      const res = await fetch(`/api/moving/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || `伺服器回應 ${res.status}`);
      }
      setData(json as MovePlanDetail);
      flashSaved();
      return json as MovePlanDetail;
    } catch (err) {
      setPatchError(err instanceof Error ? err.message : "更新失敗，請稍後再試");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const toggleItem = async (item: MoveChecklistItem) => {
    const next = !item.completed;
    // 樂觀更新，失敗再還原
    setData((d) =>
      d
        ? {
            ...d,
            checklistItems: d.checklistItems.map((i) =>
              i.id === item.id ? { ...i, completed: next } : i,
            ),
          }
        : d,
    );
    const result = await patch({
      action: "toggle",
      itemId: item.id,
      completed: next,
    });
    if (!result) {
      setData((d) =>
        d
          ? {
              ...d,
              checklistItems: d.checklistItems.map((i) =>
                i.id === item.id ? { ...i, completed: item.completed } : i,
              ),
            }
          : d,
      );
    }
  };

  const submitAdd = async (phase: PhaseKey) => {
    const title = newTitle.trim();
    if (!title) return;
    const ok = await patch({ action: "add", title, phase });
    if (ok) {
      setNewTitle("");
      setAddingPhase(null);
    }
  };

  const submitEdit = async (itemId: string) => {
    const title = editTitle.trim();
    if (!title) return;
    const ok = await patch({ action: "edit", itemId, title });
    if (ok) setEditingId(null);
  };

  const removeItem = async (item: MoveChecklistItem) => {
    if (!window.confirm(`確定要刪除「${item.title}」這一項嗎？`)) return;
    await patch({ action: "remove", itemId: item.id });
  };

  const deletePlan = async () => {
    if (!window.confirm("確定要刪除整個搬家計畫嗎？Checklist 也會一起刪除，無法復原。")) {
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/moving/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `伺服器回應 ${res.status}`);
      }
      router.push("/moving/plans");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "刪除失敗，請稍後再試");
      setDeleting(false);
    }
  };

  if (loadState !== "ready" || !data) {
    return (
      <div className="space-y-4">
        {backLink}
        {loadState === "loading" && (
          <p className="text-sm text-stone-500">載入中…</p>
        )}
        {loadState === "unauth" && (
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
        {loadState === "notfound" && (
          <p className="text-sm text-stone-600 dark:text-stone-300">
            找不到這筆搬家計畫，或它不屬於你的帳號。
          </p>
        )}
        {loadState === "error" && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            讀取時發生問題，請稍後再試。
          </p>
        )}
      </div>
    );
  }

  const total = data.checklistItems.length;
  const done = data.checklistItems.filter((i) => i.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const facts: [string, string][] = [
    ["居住情況", data.housingType],
    ["搬家公司", data.movingCompany],
    ["大型家具", data.largeFurniture.join("、") || "—"],
    ["寵物", data.pet],
    ["新家網路", data.internetSetup],
    ["舊家退租", data.moveOutStatus],
    ["需要添購", data.purchaseNeeds.join("、") || "—"],
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        {backLink}
        <button
          type="button"
          onClick={deletePlan}
          disabled={deleting}
          className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-60 dark:border-stone-700 dark:hover:bg-red-950/40 dark:hover:text-red-300"
        >
          {deleting ? "刪除中…" : "刪除計畫"}
        </button>
      </div>
      {deleteError && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300">
          {deleteError}
        </p>
      )}

      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          搬家日 {data.moveDate.replaceAll("-", "/")}
        </h2>
        <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[max-content_1fr]">
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-stone-500">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
          {data.additionalNotes && (
            <div className="contents">
              <dt className="text-stone-500">補充</dt>
              <dd className="whitespace-pre-wrap">{data.additionalNotes}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* 進度 */}
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium">
            已完成 {done} / {total} 項 · 完成度 {pct}%
          </p>
          {saved && (
            <span className="text-xs text-emerald-700 dark:text-emerald-400">
              <span aria-hidden>✓</span> 已儲存
            </span>
          )}
        </div>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-amber-600 transition-all dark:bg-amber-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {patchError && (
          <p role="alert" className="mt-2 text-xs text-red-700 dark:text-red-300">
            {patchError}
          </p>
        )}
      </div>

      {/* Checklist */}
      <div className="space-y-7">
        {PHASES.map((phase) => {
          const phaseItems = data.checklistItems.filter(
            (i) => i.phase === phase.key,
          );
          return (
            <section key={phase.key}>
              <div className="flex items-baseline justify-between gap-3 border-b border-stone-200 pb-1.5 dark:border-stone-800">
                <h3 className="text-sm font-semibold">{phase.label}</h3>
                <span className="shrink-0 text-xs tabular-nums text-stone-400">
                  {phaseItems.filter((i) => i.completed).length} /{" "}
                  {phaseItems.length}
                </span>
              </div>

              <ul className="mt-1">
                {phaseItems.map((item) => (
                  <li key={item.id} className="py-1">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2 py-1">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className={inputClass}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => submitEdit(item.id)}
                          disabled={busy || !editTitle.trim()}
                          className="shrink-0 rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900"
                        >
                          儲存
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="shrink-0 rounded-md border border-stone-300 px-3 py-1.5 text-xs dark:border-stone-700"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <div className="group flex items-start gap-3">
                        <label className="flex flex-1 cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleItem(item)}
                            className="mt-0.5 size-4 shrink-0 accent-amber-700 dark:accent-amber-500"
                          />
                          <span
                            className={`text-[15px] leading-relaxed ${
                              item.completed
                                ? "text-stone-400 line-through dark:text-stone-600"
                                : ""
                            }`}
                          >
                            {item.title}
                            {item.custom && (
                              <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 align-middle text-[11px] text-stone-500 dark:bg-stone-800">
                                自訂
                              </span>
                            )}
                          </span>
                        </label>
                        <span className="mt-0.5 flex shrink-0 gap-2 text-xs text-stone-400 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          {item.custom && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditTitle(item.title);
                              }}
                              className="hover:text-stone-900 dark:hover:text-white"
                            >
                              編輯
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeItem(item)}
                            disabled={busy}
                            className="hover:text-red-700 disabled:opacity-60 dark:hover:text-red-300"
                          >
                            刪除
                          </button>
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {addingPhase === phase.key ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="要加入的待辦…"
                    className={inputClass}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => submitAdd(phase.key)}
                    disabled={busy || !newTitle.trim()}
                    className="shrink-0 rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900"
                  >
                    新增
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingPhase(null);
                      setNewTitle("");
                    }}
                    className="shrink-0 rounded-md border border-stone-300 px-3 py-1.5 text-xs dark:border-stone-700"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAddingPhase(phase.key);
                    setNewTitle("");
                  }}
                  className="mt-2 text-xs text-stone-500 transition-colors hover:text-stone-900 dark:hover:text-white"
                >
                  ＋ 新增項目
                </button>
              )}
            </section>
          );
        })}
      </div>

      <p className="text-xs leading-relaxed text-stone-500">
        涉及租約、押金、退租責任等，請以你自己的契約內容為準，或向房東 /
        房仲 / 管理單位核實；這份清單只是提醒。
      </p>
    </div>
  );
}
