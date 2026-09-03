import { TriageSections } from "@/app/repairs/triage-sections";
import { STATUS_BADGE, STATUS_LABEL } from "@/app/repairs/status";
import type { RepairTriageResult } from "@/app/lib/repairs-types";

type FollowUp = {
  resolution: string;
  /** 已轉成顯示文字（例如「水電師傅」）*/
  handledBy: string;
  /** 已轉成顯示文字（例如「600 元」）*/
  cost: string;
  /** 已轉成顯示文字（例如「2026/09/06」）*/
  resolvedDate: string;
  note: string;
};

/**
 * 維修功能的範例：除了 AI 分診，也呈現「事件」的生命週期 —
 * 送出時自動建立成「待處理」，問題解決後回來補上後續處理、存成房子病歷。
 * 外層維持 <div class="space-y-7"> + 直接子區塊，讓「重點導覽」的聚焦邏輯共用。
 */
export function RepairsDemo({
  category,
  createdAtLabel,
  triage,
  followUp,
}: {
  category: string;
  createdAtLabel: string;
  triage: RepairTriageResult;
  followUp: FollowUp;
}) {
  return (
    <div className="space-y-7">
      {/* 0 · 事件狀態：送出分診時自動建立 */}
      <section>
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-sm font-semibold">{category}</h3>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs ${STATUS_BADGE.open}`}
          >
            {STATUS_LABEL.open}
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-stone-500">
          {createdAtLabel}．送出分診時自動建立一筆事件，不用另外按儲存，之後在「維修事件紀錄」裡找得到。
        </p>
      </section>

      {/* 1 · AI 當時的初步分診 */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-stone-500">
          AI 初步分診
        </h3>
        <TriageSections result={triage} />
      </div>

      {/* 2 · 後續處理（房子病歷）：事後回來補完並儲存 */}
      <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">後續處理</h3>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_BADGE.resolved}`}
          >
            {STATUS_LABEL.resolved}
          </span>
          <span className="text-xs text-stone-400">
            ← 問題解決後回來更新
          </span>
        </div>
        <dl className="mt-3 grid gap-x-4 gap-y-2.5 text-[15px] sm:grid-cols-[max-content_1fr]">
          <dt className="text-sm font-medium text-stone-500">
            處理方式 / 維修結果
          </dt>
          <dd className="whitespace-pre-wrap">{followUp.resolution}</dd>

          <dt className="text-sm font-medium text-stone-500">找誰處理</dt>
          <dd>{followUp.handledBy}</dd>

          <dt className="text-sm font-medium text-stone-500">費用</dt>
          <dd>{followUp.cost}</dd>

          <dt className="text-sm font-medium text-stone-500">處理日期</dt>
          <dd>{followUp.resolvedDate}</dd>

          <dt className="text-sm font-medium text-stone-500">備註</dt>
          <dd className="whitespace-pre-wrap">{followUp.note}</dd>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          這些欄位一開始是空的；問題處理完後回到這筆事件補上、按儲存，就會累積成你的「房子病歷」。
        </p>
      </section>
    </div>
  );
}
