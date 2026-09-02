"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TriageSections } from "@/app/repairs/triage-sections";
import {
  STATUS_LABEL,
  STATUS_BADGE,
  HANDLED_BY_OPTIONS,
} from "@/app/repairs/status";
import type { RepairEventDetail } from "@/app/lib/repairs-types";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:focus:ring-stone-800";

const HANDLED_BY_LABEL: Record<string, string> = Object.fromEntries(
  HANDLED_BY_OPTIONS.map((o) => [o.value, o.label]),
);

type LoadState = "loading" | "ready" | "unauth" | "notfound" | "error";
type SaveState = "idle" | "saving" | "error";

export function RepairEventDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [data, setData] = useState<RepairEventDetail | null>(null);

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [justSaved, setJustSaved] = useState(false);

  const [status, setStatus] = useState("open");
  const [resolution, setResolution] = useState("");
  const [handledBy, setHandledBy] = useState("");
  const [cost, setCost] = useState("");
  const [resolvedDate, setResolvedDate] = useState("");
  const [note, setNote] = useState("");

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fillForm = (d: RepairEventDetail) => {
    setStatus(d.status);
    setResolution(d.resolution);
    setHandledBy(d.handledBy);
    setCost(d.cost === null ? "" : String(d.cost));
    setResolvedDate(d.resolvedDate ?? "");
    setNote(d.note);
  };

  const applyData = (d: RepairEventDetail) => {
    setData(d);
    fillForm(d);
  };

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/repairs/${id}`)
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
        if (cancelled) return;
        const d = json as RepairEventDetail;
        setData(d);
        setStatus(d.status);
        setResolution(d.resolution);
        setHandledBy(d.handledBy);
        setCost(d.cost === null ? "" : String(d.cost));
        setResolvedDate(d.resolvedDate ?? "");
        setNote(d.note);
        setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const startEdit = () => {
    if (data) fillForm(data);
    setSaveState("idle");
    setSaveError("");
    setJustSaved(false);
    setMode("edit");
  };

  const cancelEdit = () => {
    if (data) fillForm(data);
    setSaveState("idle");
    setSaveError("");
    setMode("view");
  };

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState("saving");
    setSaveError("");
    try {
      const res = await fetch(`/api/repairs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          resolution,
          handledBy,
          cost: cost.trim() === "" ? null : Number(cost),
          resolvedDate: resolvedDate.trim() === "" ? null : resolvedDate,
          note,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || `伺服器回應 ${res.status}`);
      }
      applyData(json as RepairEventDetail);
      setSaveState("idle");
      setMode("view"); // 儲存後跳出編輯
      setJustSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "更新失敗，請稍後再試");
      setSaveState("error");
    }
  };

  const onDelete = async () => {
    if (
      !window.confirm("確定要刪除這筆事件嗎？連同上傳的照片一起刪除，無法復原。")
    ) {
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/repairs/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `伺服器回應 ${res.status}`);
      }
      router.push("/repairs/events");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "刪除失敗，請稍後再試");
      setDeleting(false);
    }
  };

  const backLink = (
    <Link
      href="/repairs/events"
      className="inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-900 dark:hover:text-white"
    >
      <span aria-hidden>←</span> 維修事件紀錄
    </Link>
  );

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
            找不到這筆事件，或它不屬於你的帳號。
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

  const d = data;
  const hasFollowUp =
    d.status !== "open" ||
    d.resolution !== "" ||
    d.handledBy !== "" ||
    d.cost !== null ||
    d.resolvedDate !== null ||
    d.note !== "";

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        {backLink}
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-60 dark:border-stone-700 dark:hover:bg-red-950/40 dark:hover:text-red-300"
        >
          {deleting ? "刪除中…" : "刪除事件"}
        </button>
      </div>
      {deleteError && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300">
          {deleteError}
        </p>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{d.category}</h2>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              STATUS_BADGE[d.status] ?? "border-stone-300"
            }`}
          >
            {STATUS_LABEL[d.status] ?? d.status}
          </span>
        </div>
        <p className="text-xs text-stone-500">
          建立於 {new Date(d.createdAt).toLocaleString("zh-TW")}
        </p>
      </div>

      <section>
        <h3 className="border-b border-stone-200 pb-1.5 text-sm font-semibold dark:border-stone-800">
          問題描述
        </h3>
        <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700 dark:text-stone-300">
          {d.description || "（沒有文字描述）"}
        </p>
      </section>

      {d.photoUrl && (
        <section>
          <h3 className="border-b border-stone-200 pb-1.5 text-sm font-semibold dark:border-stone-800">
            上傳的照片
          </h3>
          <a
            href={d.photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block w-fit"
          >
            {/* 使用者自己拍的照片，直接用 img 呈現 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={d.photoUrl}
              alt="使用者上傳的現場照片"
              className="max-h-96 rounded-lg border border-stone-200 dark:border-stone-800"
            />
          </a>
        </section>
      )}

      {/* 後續處理：放在 AI 分診上方，避免要滑很久才看到 */}
      <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
        {mode === "view" ? (
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">後續處理</h3>
                {justSaved && (
                  <span className="text-xs text-emerald-700 dark:text-emerald-400">
                    <span aria-hidden>✓</span> 已儲存
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={startEdit}
                className="shrink-0 rounded-md border border-stone-300 px-2.5 py-1 text-xs transition-colors hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
              >
                {hasFollowUp ? "編輯" : "補充處理結果"}
              </button>
            </div>

            {!hasFollowUp ? (
              <p className="mt-3 text-sm text-stone-500">
                問題處理完之後，回這裡補充處理方式、找誰處理、費用等。
              </p>
            ) : (
              <dl className="mt-3 grid gap-x-4 gap-y-2.5 text-[15px] sm:grid-cols-[max-content_1fr]">
                <dt className="text-sm font-medium text-stone-500">狀態</dt>
                <dd>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      STATUS_BADGE[d.status] ?? "border-stone-300"
                    }`}
                  >
                    {STATUS_LABEL[d.status] ?? d.status}
                  </span>
                </dd>

                <dt className="text-sm font-medium text-stone-500">
                  處理方式 / 維修結果
                </dt>
                <dd className="whitespace-pre-wrap">
                  {d.resolution || <span className="text-stone-400">—</span>}
                </dd>

                <dt className="text-sm font-medium text-stone-500">找誰處理</dt>
                <dd>
                  {d.handledBy ? (
                    HANDLED_BY_LABEL[d.handledBy] ?? d.handledBy
                  ) : (
                    <span className="text-stone-400">—</span>
                  )}
                </dd>

                <dt className="text-sm font-medium text-stone-500">費用</dt>
                <dd>
                  {d.cost !== null ? (
                    `${d.cost} 元`
                  ) : (
                    <span className="text-stone-400">—</span>
                  )}
                </dd>

                <dt className="text-sm font-medium text-stone-500">處理日期</dt>
                <dd>
                  {d.resolvedDate ? (
                    d.resolvedDate.replaceAll("-", "/")
                  ) : (
                    <span className="text-stone-400">—</span>
                  )}
                </dd>

                <dt className="text-sm font-medium text-stone-500">備註</dt>
                <dd className="whitespace-pre-wrap">
                  {d.note || <span className="text-stone-400">—</span>}
                </dd>
              </dl>
            )}
          </div>
        ) : (
          <form onSubmit={onSave} className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold">編輯後續處理</h3>
              <p className="mt-1 text-xs text-stone-500">
                所有欄位都可以留空。
              </p>
            </div>

            <div>
              <label htmlFor="fu-status" className="text-sm font-medium">
                狀態
              </label>
              <select
                id="fu-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`mt-2 ${inputClass}`}
              >
                <option value="open">待處理</option>
                <option value="in_progress">處理中</option>
                <option value="resolved">已解決</option>
              </select>
            </div>

            <div>
              <label htmlFor="fu-resolution" className="text-sm font-medium">
                處理方式 / 維修結果
              </label>
              <textarea
                id="fu-resolution"
                rows={4}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="例如：找水電師傅來看，是水管接頭鬆脫，重新鎖緊並換墊片。"
                className={`mt-2 resize-y ${inputClass}`}
              />
            </div>

            <div>
              <label htmlFor="fu-handledby" className="text-sm font-medium">
                找誰處理
              </label>
              <select
                id="fu-handledby"
                value={handledBy}
                onChange={(e) => setHandledBy(e.target.value)}
                className={`mt-2 ${inputClass}`}
              >
                {HANDLED_BY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fu-cost" className="text-sm font-medium">
                  費用
                  <span className="ml-1 font-normal text-stone-400">
                    （可留空）
                  </span>
                </label>
                <input
                  id="fu-cost"
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="例如 1500"
                  className={`mt-2 ${inputClass}`}
                />
              </div>
              <div>
                <label htmlFor="fu-date" className="text-sm font-medium">
                  處理日期
                  <span className="ml-1 font-normal text-stone-400">
                    （可留空）
                  </span>
                </label>
                <input
                  id="fu-date"
                  type="date"
                  value={resolvedDate}
                  onChange={(e) => setResolvedDate(e.target.value)}
                  className={`mt-2 ${inputClass}`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="fu-note" className="text-sm font-medium">
                備註
                <span className="ml-1 font-normal text-stone-400">
                  （可留空）
                </span>
              </label>
              <textarea
                id="fu-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`mt-2 resize-y ${inputClass}`}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saveState === "saving"}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-stone-900 px-5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
              >
                {saveState === "saving" ? "儲存中…" : "儲存"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saveState === "saving"}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-300 px-4 text-sm transition-colors hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:hover:bg-stone-900"
              >
                取消
              </button>
            </div>
            {saveState === "error" && (
              <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                {saveError}
              </p>
            )}
          </form>
        )}
      </section>

      <div>
        <h3 className="mb-3 text-sm font-semibold">AI 當時的初步分診</h3>
        {d.aiTriageResult ? (
          <TriageSections result={d.aiTriageResult} />
        ) : (
          <p className="text-sm text-stone-500">沒有分診結果。</p>
        )}
      </div>
    </div>
  );
}
