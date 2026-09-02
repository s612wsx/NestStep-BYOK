"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  HOUSING_TYPES,
  MOVING_COMPANY_OPTIONS,
  LARGE_FURNITURE_OPTIONS,
  LARGE_FURNITURE_NONE,
  PET_OPTIONS,
  INTERNET_OPTIONS,
  MOVE_OUT_OPTIONS,
  PURCHASE_OPTIONS,
  PURCHASE_NONE,
  type MovePlanDetail,
} from "@/app/lib/move-plan-types";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:focus:ring-stone-800";

type Status = "idle" | "loading" | "done" | "error";

function RadioRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              type="button"
              key={opt}
              onClick={() => onChange(opt)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-amber-700 bg-amber-700 text-white dark:border-amber-500 dark:bg-amber-500 dark:text-stone-900"
                  : "border-stone-300 text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-500"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function CheckRow({
  label,
  hint,
  options,
  value,
  onToggle,
}: {
  label: string;
  hint?: string;
  options: readonly string[];
  value: string[];
  onToggle: (opt: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              checked={value.includes(opt)}
              onChange={() => onToggle(opt)}
              className="size-4 accent-amber-700 dark:accent-amber-500"
            />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function MovingForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [moveDate, setMoveDate] = useState("");
  const [housingType, setHousingType] = useState("");
  const [movingCompany, setMovingCompany] = useState("");
  const [largeFurniture, setLargeFurniture] = useState<string[]>([]);
  const [pet, setPet] = useState("");
  const [internetSetup, setInternetSetup] = useState("");
  const [moveOutStatus, setMoveOutStatus] = useState("");
  const [purchaseNeeds, setPurchaseNeeds] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const toggleExclusive = (
    setter: (updater: (cur: string[]) => string[]) => void,
    none: string,
    opt: string,
  ) => {
    setter((cur) => {
      if (opt === none) {
        return cur.includes(none) ? [] : [none];
      }
      const withoutNone = cur.filter((x) => x !== none);
      return withoutNone.includes(opt)
        ? withoutNone.filter((x) => x !== opt)
        : [...withoutNone, opt];
    });
  };

  const canSubmit =
    moveDate !== "" &&
    housingType !== "" &&
    movingCompany !== "" &&
    largeFurniture.length > 0 &&
    pet !== "" &&
    internetSetup !== "" &&
    moveOutStatus !== "" &&
    purchaseNeeds.length > 0;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/moving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moveDate,
          housingType,
          movingCompany,
          largeFurniture,
          pet,
          internetSetup,
          moveOutStatus,
          purchaseNeeds,
          additionalNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || `伺服器回應 ${res.status}`);
      }
      setStatus("done");
      const plan = json as MovePlanDetail;
      setTimeout(() => router.push(`/moving/${plan.id}`), 700);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "建立失敗，請稍後再試");
      setStatus("error");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2.5" aria-busy="true">
        <span className="size-2 animate-pulse rounded-full bg-amber-600 dark:bg-amber-500" />
        <p className="text-sm text-stone-600 dark:text-stone-300">
          AI 正在依你的情況安排搬家 Checklist，通常需要十幾秒到半分鐘…
        </p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
        <span aria-hidden>✓</span> 搬家計畫已建立，正在開啟…
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      {status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {errorMsg}
        </p>
      )}

      <div>
        <label htmlFor="mv-date" className="text-sm font-medium">
          預計搬家日期
        </label>
        <input
          id="mv-date"
          type="date"
          value={moveDate}
          onChange={(e) => setMoveDate(e.target.value)}
          className={`mt-2 block ${inputClass}`}
        />
      </div>

      <div>
        <label htmlFor="mv-housing" className="text-sm font-medium">
          目前居住情況
        </label>
        <select
          id="mv-housing"
          value={housingType}
          onChange={(e) => setHousingType(e.target.value)}
          className={`mt-2 ${inputClass}`}
        >
          <option value="">請選擇</option>
          {HOUSING_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <RadioRow
        label="是否需要搬家公司"
        options={MOVING_COMPANY_OPTIONS}
        value={movingCompany}
        onChange={setMovingCompany}
      />

      <CheckRow
        label="大型家具"
        hint="有哪些大型家具要搬？沒有的話請勾「沒有」。"
        options={LARGE_FURNITURE_OPTIONS}
        value={largeFurniture}
        onToggle={(opt) =>
          toggleExclusive(setLargeFurniture, LARGE_FURNITURE_NONE, opt)
        }
      />

      <RadioRow
        label="寵物"
        options={PET_OPTIONS}
        value={pet}
        onChange={setPet}
      />

      <RadioRow
        label="是否需要申請新家網路"
        options={INTERNET_OPTIONS}
        value={internetSetup}
        onChange={setInternetSetup}
      />

      <RadioRow
        label="是否需要辦理舊家退租"
        options={MOVE_OUT_OPTIONS}
        value={moveOutStatus}
        onChange={setMoveOutStatus}
      />

      <CheckRow
        label="需要添購的物品"
        hint="打算添購哪些類別？不用添購的話請勾「不需要」。"
        options={PURCHASE_OPTIONS}
        value={purchaseNeeds}
        onToggle={(opt) =>
          toggleExclusive(setPurchaseNeeds, PURCHASE_NONE, opt)
        }
      />

      <div>
        <label htmlFor="mv-notes" className="text-sm font-medium">
          其他補充情況
          <span className="ml-1 font-normal text-stone-400">（選填）</span>
        </label>
        <p className="mt-1 text-xs text-stone-500">
          有特殊需求或狀況可以寫在這裡，AI 會一併考慮。
        </p>
        <textarea
          id="mv-notes"
          rows={3}
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="例如：新家在 5 樓沒電梯、需要當天就能上網、有大型水族缸……"
          className={`mt-2 resize-y ${inputClass}`}
        />
      </div>

      <div className="pt-1">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-stone-900 px-5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-60 sm:w-auto dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
        >
          產生搬家 Checklist
        </button>
      </div>
    </form>
  );
}
