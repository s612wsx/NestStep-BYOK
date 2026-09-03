import type { ReactNode } from "react";
import type { RentingAnalysisResult } from "@/app/lib/renting-analysis-types";

export const SECTION_TITLES = [
  "已明確提供的資訊",
  "可能沒說清楚的地方",
  "建議核實的資訊",
  "建議進一步詢問的問題",
] as const;

function Section({
  title,
  hint,
  count,
  children,
}: {
  title: string;
  hint: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 border-b border-stone-200 pb-1.5 dark:border-stone-800">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="shrink-0 text-xs tabular-nums text-stone-400">
          {count}
        </span>
      </div>
      <p className="mt-1 text-xs text-stone-500">{hint}</p>
      <div className="mt-2.5 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-stone-500">這份內容沒有相關項目。</p>;
}

function QuoteList({ items }: { items: { quote: string; note: string }[] }) {
  return (
    <ul className="space-y-3">
      {items.map((row, index) => (
        <li key={index}>
          <p className="font-medium">「{row.quote}」</p>
          <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
            {row.note}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** AI 分析結果的四個分區（送出後與歷史紀錄詳情共用） */
export function AnalysisSections({ result }: { result: RentingAnalysisResult }) {
  const unclearItems = [
    ...result.vagueStatements.map((v) => ({ quote: v.quote, note: v.issue })),
    ...result.conditionalClaims.map((c) => ({
      quote: c.quote,
      note: `只有在「${c.condition}」的前提下才成立`,
    })),
  ];

  return (
    <div className="space-y-7">
      <Section
        title={SECTION_TITLES[0]}
        hint="廣告或文件中有具體寫出來的內容。"
        count={result.clearFacts.length}
      >
        {result.clearFacts.length === 0 ? (
          <Empty />
        ) : (
          <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[max-content_1fr]">
            {result.clearFacts.map((fact, index) => (
              <div key={index} className="contents">
                <dt className="text-sm font-medium text-stone-500">
                  {fact.label}
                </dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Section>

      <Section
        title={SECTION_TITLES[1]}
        hint="用字含糊、缺少明確數字，或帶有前提的說法。"
        count={unclearItems.length}
      >
        {unclearItems.length === 0 ? (
          <Empty />
        ) : (
          <QuoteList items={unclearItems} />
        )}
      </Section>

      <Section
        title={SECTION_TITLES[2]}
        hint="內容沒有提到、簽約前值得自己再確認的資訊。"
        count={result.missingInfo.length}
      >
        {result.missingInfo.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-1.5">
            {result.missingInfo.map((item, index) => (
              <li key={index} className="flex gap-2">
                <span aria-hidden className="text-stone-400">
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title={SECTION_TITLES[3]}
        hint="可以直接拿去問房東、仲介或建商。"
        count={result.questionsToAsk.length}
      >
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
        以上是 AI 依你提供的內容做的整理，可能有誤解或遺漏，不是對物件好壞、安全與否的判斷，也不是租不租的建議。適合用來提醒自己還要確認什麼，不適合當成房東或仲介有問題的證據或談判依據；實際情況仍以正式文件與雙方確認為準。
      </p>
    </div>
  );
}
