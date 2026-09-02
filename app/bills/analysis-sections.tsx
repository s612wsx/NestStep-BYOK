import type { ReactNode } from "react";
import type { BillAnalysisResult } from "@/app/lib/bill-analysis-types";

export const SECTION_TITLES = [
  "帳單摘要",
  "費用明細",
  "金額怎麼組成",
  "需要注意或再確認的地方",
  "建議詢問的問題",
] as const;

function Section({
  title,
  hint,
  count,
  children,
}: {
  title: string;
  hint?: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 border-b border-stone-200 pb-1.5 dark:border-stone-800">
        <h3 className="text-sm font-semibold">{title}</h3>
        {typeof count === "number" && (
          <span className="shrink-0 text-xs tabular-nums text-stone-400">
            {count}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
      <div className="mt-2.5 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-stone-500">這份帳單沒有相關項目。</p>;
}

/** 帳單分析結果的五個分區（送出後與歷史紀錄詳情共用）*/
export function BillAnalysisSections({
  result,
}: {
  result: BillAnalysisResult;
}) {
  return (
    <div className="space-y-7">
      <Section title={SECTION_TITLES[0]}>
        <p className="whitespace-pre-wrap">
          {result.billSummary || (
            <span className="text-stone-500">AI 沒有給出摘要。</span>
          )}
        </p>
      </Section>

      <Section
        title={SECTION_TITLES[1]}
        hint="帳單中各項費用與金額（讀不到的會標示未列出 / 無法確認）。"
        count={result.feeItems.length}
      >
        {result.feeItems.length === 0 ? (
          <Empty />
        ) : (
          <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[1fr_max-content]">
            {result.feeItems.map((item, index) => (
              <div key={index} className="contents">
                <dt>{item.label}</dt>
                <dd className="text-right tabular-nums text-stone-600 dark:text-stone-300">
                  {item.amount}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Section>

      <Section
        title={SECTION_TITLES[2]}
        hint="本期費用主要由哪些項目構成；資訊不足時 AI 會直接說無法確認。"
      >
        <p className="whitespace-pre-wrap">
          {result.amountBreakdown || (
            <span className="text-stone-500">AI 沒有說明。</span>
          )}
        </p>
      </Section>

      <Section
        title={SECTION_TITLES[3]}
        hint="不清楚的費用、額外收費、費率變化、計費期間差異、模糊項目等。"
        count={result.unclearPoints.length}
      >
        {result.unclearPoints.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-3">
            {result.unclearPoints.map((row, index) => (
              <li key={index}>
                <p className="font-medium">{row.point}</p>
                <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
                  {row.note}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={SECTION_TITLES[4]} count={result.questionsToAsk.length}>
        {result.questionsToAsk.length === 0 ? (
          <Empty />
        ) : (
          <ol className="space-y-1.5">
            {result.questionsToAsk.map((item, index) => (
              <li key={index} className="flex gap-2">
                <span className="tabular-nums text-stone-400">{index + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <p className="text-xs leading-relaxed text-stone-500">
        以上是 AI 依帳單內容做的客觀整理與說明，不是對帳單「有沒有錯」、「有沒有被多收」的判斷。實際情況仍以帳單正本與相關單位的說明為準。
      </p>
    </div>
  );
}
