import type { ReactNode } from "react";
import type { DocumentAnalysisResult } from "@/app/lib/document-analysis-types";

export const SECTION_TITLES = [
  "文件摘要",
  "重要條件",
  "白話翻譯",
  "沒說清楚 / 容易忽略的地方",
  "建議再確認的問題",
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
  return <p className="text-sm text-stone-500">這份文件沒有相關項目。</p>;
}

/** 文件分析結果的五個分區（送出後與歷史紀錄詳情共用）*/
export function DocumentAnalysisSections({
  result,
}: {
  result: DocumentAnalysisResult;
}) {
  return (
    <div className="space-y-7">
      <Section title={SECTION_TITLES[0]}>
        <p>
          {result.documentSummary || (
            <span className="text-stone-500">AI 沒有給出摘要。</span>
          )}
        </p>
      </Section>

      <Section
        title={SECTION_TITLES[1]}
        hint="金額、期限、付款方式、限制、違約、解約、責任、保固等。"
        count={result.keyTerms.length}
      >
        {result.keyTerms.length === 0 ? (
          <Empty />
        ) : (
          <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[max-content_1fr]">
            {result.keyTerms.map((term, index) => (
              <div key={index} className="contents">
                <dt className="text-sm font-medium text-stone-500">
                  {term.label}
                </dt>
                <dd>{term.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Section>

      <Section
        title={SECTION_TITLES[2]}
        hint="把難懂、專業或冗長的內容換成白話說法。"
        count={result.plainLanguage.length}
      >
        {result.plainLanguage.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-4">
            {result.plainLanguage.map((row, index) => (
              <li key={index}>
                <p className="text-sm text-stone-500">{row.original}</p>
                <p className="mt-1">{row.plain}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title={SECTION_TITLES[3]}
        hint="模糊表述、附帶條件、例外、限制或資訊缺口。"
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
        以上是 AI 依文件內容做的客觀整理與白話說明，不是法律意見，也不是「該不該簽」或「有沒有問題」的判斷。實際情況仍以正式文件與雙方確認為準。
      </p>
    </div>
  );
}
