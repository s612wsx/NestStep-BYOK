import { PHASES } from "@/app/lib/move-plan-types";
import type { MovingSampleItem } from "./demo-data";

/**
 * 搬家範例用的唯讀清單。真實功能的清單元件可勾選、會打 API，
 * 範例只需要靜態呈現「依搬家日分階段」的樣子，所以另外畫一份。
 * 外層結構刻意跟其他結果元件一致（<div class="space-y-7"> + 多個 <section>），
 * 讓「重點導覽」的聚焦邏輯可以共用。
 */
export function StaticChecklist({ items }: { items: MovingSampleItem[] }) {
  const done = items.filter((it) => it.completed).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold">完成進度</p>
          <span className="text-xs tabular-nums text-stone-400">
            {done} / {items.length}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div
            className="h-full rounded-full bg-amber-600"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {PHASES.map((phase) => {
        const group = items.filter((it) => it.phase === phase.key);
        if (group.length === 0) return null;
        return (
          <section key={phase.key}>
            <h3 className="border-b border-stone-200 pb-1.5 text-sm font-semibold dark:border-stone-800">
              {phase.label}
            </h3>
            <ul className="mt-2.5 space-y-2 text-[15px] leading-relaxed">
              {group.map((it, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border text-[10px] ${
                      it.completed
                        ? "border-amber-600 bg-amber-600 text-white"
                        : "border-stone-300 dark:border-stone-600"
                    }`}
                  >
                    {it.completed ? "✓" : ""}
                  </span>
                  <span
                    className={
                      it.completed
                        ? "text-stone-400 line-through"
                        : undefined
                    }
                  >
                    {it.title}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="text-xs leading-relaxed text-stone-500">
        以上是依搬家日期與情況產生的範例清單，實際項目會依你填的內容而不同，且每一項都可以勾選、追蹤進度。
      </p>
    </div>
  );
}
