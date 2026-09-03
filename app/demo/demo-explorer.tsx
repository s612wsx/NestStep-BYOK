"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { features, type FeatureSlug } from "@/lib/features";
import type { Callout, DemoMeta } from "./demo-data";

type Props = {
  /** 每個功能的範例結果節點（在 server component 先渲染好傳進來）*/
  nodes: Record<FeatureSlug, ReactNode>;
  meta: Record<FeatureSlug, DemoMeta>;
  callouts: Record<FeatureSlug, Callout[]>;
  initialFeature: FeatureSlug;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** 清掉之前加在區塊上的行內樣式 */
function resetBlocks(blocks: HTMLElement[]) {
  for (const el of blocks) {
    el.style.opacity = "";
    el.style.transform = "";
    el.style.outline = "";
    el.style.outlineOffset = "";
    el.style.borderRadius = "";
  }
}

export function DemoExplorer({ nodes, meta, callouts, initialFeature }: Props) {
  const [active, setActive] = useState<FeatureSlug>(initialFeature);
  const [step, setStep] = useState<number | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const feature = features.find((f) => f.slug === active) ?? features[0];
  const list = callouts[active] ?? [];
  const current = step != null ? (list[step] ?? null) : null;

  // 換功能時一併收起聚光燈
  const selectFeature = (slug: FeatureSlug) => {
    setActive(slug);
    setStep(null);
  };

  // 把目前的功能反映到網址（?feature=），不觸發導航
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("feature", active);
    window.history.replaceState(null, "", url);
  }, [active]);

  // 套用 / 收起聚光燈效果
  useEffect(() => {
    const root = bodyRef.current?.querySelector(
      "[data-spotlight-root]",
    )?.firstElementChild;
    const blocks = root
      ? (Array.from(root.children) as HTMLElement[])
      : [];
    const reduce = prefersReducedMotion();

    if (current == null) {
      resetBlocks(blocks);
      return;
    }

    blocks.forEach((el, i) => {
      const on = i === current.blockIndex;
      el.style.transition = reduce
        ? ""
        : "opacity .2s ease, transform .2s ease";
      el.style.opacity = on ? "1" : "0.3";
      el.style.transform = on && !reduce ? "scale(1.015)" : "";
      el.style.outline = on ? "2px solid rgb(217 119 6)" : "";
      el.style.outlineOffset = on ? "8px" : "";
      el.style.borderRadius = on ? "6px" : "";
    });

    const target = blocks[current.blockIndex];
    if (target) {
      target.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "center",
      });
    }

    return () => resetBlocks(blocks);
  }, [current, active]);

  // 導覽進行中時，用鍵盤 ← → 切換、Esc 收起
  useEffect(() => {
    if (step == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setStep((s) => Math.min(list.length - 1, (s ?? 0) + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setStep((s) => Math.max(0, (s ?? 0) - 1));
      } else if (e.key === "Escape") {
        setStep(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, list.length]);

  return (
    <div>
      {/* 功能切換 */}
      <div className="-mx-5 overflow-x-auto px-5">
        <div className="flex gap-1.5 pb-1">
          {features.map((f) => {
            const on = f.slug === active;
            return (
              <button
                key={f.slug}
                type="button"
                onClick={() => selectFeature(f.slug)}
                aria-pressed={on}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  on
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                    : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
                }`}
              >
                <span aria-hidden>{f.emoji}</span>
                {f.navLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* 目前功能標題 */}
      <div className="mt-6 flex items-center gap-2.5">
        <span aria-hidden className="text-2xl">
          {feature.emoji}
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {feature.title}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {feature.tagline}
          </p>
        </div>
      </div>

      {/* 重點導覽（捲動時固定在頂端，數字與上一個 / 下一個永遠點得到）*/}
      <div className="sticky top-14 z-10 mt-5 rounded-lg border border-stone-200 bg-stone-50/95 p-3 shadow-sm backdrop-blur-sm dark:border-stone-800 dark:bg-stone-950/90">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-stone-500">重點導覽</span>
          {list.map((c, i) => {
            const on = step === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setStep(on ? null : i)}
                aria-pressed={on}
                aria-label={`重點 ${c.n}：${c.label}`}
                className={`grid size-7 place-items-center rounded-full text-sm font-semibold transition-colors ${
                  on
                    ? "bg-amber-600 text-white"
                    : "bg-amber-600/10 text-amber-700 hover:bg-amber-600/20 dark:text-amber-400"
                }`}
              >
                {c.n}
              </button>
            );
          })}
          {step != null && (
            <button
              type="button"
              onClick={() => setStep(null)}
              className="ml-auto text-xs text-stone-500 underline underline-offset-2 transition-colors hover:text-stone-900 dark:hover:text-white"
            >
              清除
            </button>
          )}
        </div>

        {current ? (
          <div className="mt-2.5 space-y-2">
            <div className="flex items-start gap-2 text-[15px] leading-relaxed">
              <span className="mt-0.5 shrink-0 font-semibold text-amber-700 dark:text-amber-400">
                {current.n}.
              </span>
              <p className="min-w-0 flex-1">{current.label}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, (s ?? 0) - 1))}
                disabled={step === 0}
                className="rounded-md border border-stone-300 px-2.5 py-1 text-xs transition-colors hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-stone-700 dark:hover:bg-stone-800 dark:disabled:hover:bg-transparent"
              >
                ← 上一個
              </button>
              <button
                type="button"
                onClick={() =>
                  setStep((s) => Math.min(list.length - 1, (s ?? 0) + 1))
                }
                disabled={step === list.length - 1}
                className="rounded-md border border-stone-300 px-2.5 py-1 text-xs transition-colors hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-stone-700 dark:hover:bg-stone-800 dark:disabled:hover:bg-transparent"
              >
                下一個 →
              </button>
              <span className="ml-auto text-xs tabular-nums text-stone-400">
                {(step ?? 0) + 1} / {list.length}
              </span>
            </div>
            <p className="hidden text-[11px] text-stone-400 sm:block">
              也可以用鍵盤 ← → 切換、Esc 收起
            </p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-stone-500">
            點上面的數字，看這個功能各區塊在幫你做什麼；或按第一個數字，用「上一個 / 下一個」逐段看。
          </p>
        )}
      </div>

      {/* 範例結果卡 */}
      <div className="mt-5 rounded-xl border border-stone-200 p-5 sm:p-6 dark:border-stone-800">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-stone-200 pb-4 dark:border-stone-800">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight">
              {meta[active].sampleTitle}
            </p>
            <p className="mt-0.5 text-xs text-stone-500">{meta[active].note}</p>
          </div>
          <span className="shrink-0 rounded-full bg-amber-600/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            範例
          </span>
        </div>

        <div ref={bodyRef}>
          <div data-spotlight-root>{nodes[active]}</div>
        </div>
      </div>

      {/* 底部 CTA */}
      <div className="mt-8 rounded-lg bg-stone-100 p-5 dark:bg-stone-900">
        <p className="text-[15px] font-medium">想用自己的資料試試？</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          上面是固定的假資料。實際使用時會用你自己的 OpenAI
          金鑰分析，結果會存進你的帳號，方便日後回看。
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href={`/${active}`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-stone-900 px-4 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
          >
            前往「{feature.navLabel}」
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-300 px-4 text-sm transition-colors hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
          >
            註冊帳號
          </Link>
          <Link
            href="/settings"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-300 px-4 text-sm transition-colors hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
          >
            設定 API 金鑰
          </Link>
        </div>
      </div>
    </div>
  );
}
