import type { ReactNode } from "react";
import type {
  RepairDangerLevel,
  RepairTriageResult,
} from "@/app/lib/repairs-types";

export const SECTION_TITLES = [
  "現在第一步可以做什麼",
  "可能屬於哪些類型的問題",
  "不建議自行處理的事",
  "建議找誰協助",
  "需要立即停用或求助的情況",
] as const;

export const DANGER_META: Record<
  RepairDangerLevel,
  { label: string; box: string }
> = {
  low: {
    label: "風險較低",
    box: "border-stone-300 bg-stone-100 dark:border-stone-700 dark:bg-stone-900",
  },
  medium: {
    label: "需要留意",
    box: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100",
  },
  high: {
    label: "可能有立即危險",
    box: "border-red-300 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100",
  },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="border-b border-stone-200 pb-1.5 text-sm font-semibold dark:border-stone-800">
        {title}
      </h3>
      <div className="mt-2.5 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-stone-500">這次沒有相關項目。</p>;
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <Empty />;
  return (
    <ul className="space-y-1.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2">
          <span aria-hidden className="text-stone-400">
            •
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function OrderedList({ items }: { items: string[] }) {
  if (items.length === 0) return <Empty />;
  return (
    <ol className="space-y-1.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2">
          <span className="tabular-nums text-stone-400">{index + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

/** AI 初步分診結果：危險提示 + 五個區塊（送出後與事件詳情頁共用）*/
export function TriageSections({ result }: { result: RepairTriageResult }) {
  const danger = DANGER_META[result.immediateDanger.level];

  return (
    <div className="space-y-7">
      <div className={`rounded-lg border px-4 py-3 ${danger.box}`}>
        <p className="text-sm font-semibold">
          是否可能有立即危險：{danger.label}
        </p>
        <p className="mt-1 text-sm leading-relaxed">
          {result.immediateDanger.summary || "AI 沒有特別說明。"}
        </p>
      </div>

      <Section title={SECTION_TITLES[0]}>
        <OrderedList items={result.firstSteps} />
      </Section>

      <Section title={SECTION_TITLES[1]}>
        <BulletList items={result.possibleCategories} />
      </Section>

      <Section title={SECTION_TITLES[2]}>
        <BulletList items={result.doNotDIY} />
      </Section>

      <Section title={SECTION_TITLES[3]}>
        {result.whoToContact.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-3">
            {result.whoToContact.map((contact, index) => (
              <li key={index}>
                <p className="font-medium">{contact.who}</p>
                <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
                  {contact.why}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={SECTION_TITLES[4]}>
        <BulletList items={result.stopUsingIf} />
      </Section>

      <p className="text-xs leading-relaxed text-stone-500">
        以上是 AI 依你提供的資訊做的初步分診，不是專業診斷或維修指示。如有觸電、火災、瓦斯外洩或明顯結構危險等疑慮，請立即離開現場並撥打 119 / 112。
      </p>
    </div>
  );
}
