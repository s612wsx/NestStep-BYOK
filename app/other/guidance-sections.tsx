import type { ReactNode } from "react";
import Link from "next/link";
import {
  FEATURE_LABEL,
  FEATURE_PATH,
  type LifeGuidance,
} from "@/app/lib/life-query-types";

export const SECTION_TITLES = [
  "這比較像哪一類問題",
  "現在可以先做什麼",
  "建議找誰協助",
  "是否適合轉到其他功能",
] as const;

function Section({
  title,
  count,
  children,
}: {
  title: string;
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
      <div className="mt-2.5 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-stone-500">這次沒有相關項目。</p>;
}

/** 生活問題導航結果（送出後與歷史紀錄詳情共用）*/
export function GuidanceSections({
  detectedCategory,
  guidance,
}: {
  detectedCategory: string;
  guidance: LifeGuidance;
}) {
  const sf = guidance.suggestedFeature;
  const featurePath =
    sf.feature !== "none" ? FEATURE_PATH[sf.feature] : null;

  return (
    <div className="space-y-7">
      {guidance.safetyAlert.hasRisk && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
          <p className="text-sm font-semibold">
            <span aria-hidden>⚠️</span> 可能有立即安全風險
          </p>
          <p className="mt-1 text-sm leading-relaxed">
            {guidance.safetyAlert.note ||
              "請先停止自行處理，並尋求適當的緊急協助。"}
          </p>
        </div>
      )}

      <Section title={SECTION_TITLES[0]}>
        <p>
          {detectedCategory || (
            <span className="text-stone-500">AI 沒有給出判斷。</span>
          )}
        </p>
      </Section>

      <Section title={SECTION_TITLES[1]} count={guidance.firstSteps.length}>
        {guidance.firstSteps.length === 0 ? (
          <Empty />
        ) : (
          <ol className="space-y-1.5">
            {guidance.firstSteps.map((item, index) => (
              <li key={index} className="flex gap-2">
                <span className="tabular-nums text-stone-400">
                  {index + 1}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title={SECTION_TITLES[2]} count={guidance.whoToContact.length}>
        {guidance.whoToContact.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-3">
            {guidance.whoToContact.map((c, index) => (
              <li key={index}>
                <p className="font-medium">{c.who}</p>
                <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
                  {c.why}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={SECTION_TITLES[3]}>
        {featurePath ? (
          <div className="space-y-2">
            <p>
              建議轉到「
              <span className="font-medium">{FEATURE_LABEL[sf.feature]}</span>
              」做更完整的處理。
            </p>
            {sf.reason && (
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {sf.reason}
              </p>
            )}
            <Link
              href={featurePath}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-stone-900 px-4 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
            >
              前往「{FEATURE_LABEL[sf.feature]}」 →
            </Link>
          </div>
        ) : (
          <p className="text-stone-600 dark:text-stone-400">
            {sf.reason || "這個問題留在這裡處理即可，沒有更適合的功能。"}
          </p>
        )}
      </Section>

      <p className="text-xs leading-relaxed text-stone-500">
        以上是 AI 的初步導航，不是專業診斷或建議。涉及法律、醫療、電氣、結構等需要專業判斷的部分，請找對應的專業人員。
      </p>
    </div>
  );
}
