"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type FieldConfig = { label: string; hint?: string; placeholder?: string };
type FileConfig = {
  label: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
};
type QuickPicksConfig = { label: string; options: string[] };

export type AnalyzeFormProps = {
  quickPicks?: QuickPicksConfig;
  textField?: FieldConfig;
  urlField?: FieldConfig;
  fileField?: FileConfig;
  submitLabel: string;
};

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:focus:ring-stone-800";

export function AnalyzeForm({
  quickPicks,
  textField,
  urlField,
  fileField,
  submitLabel,
}: AnalyzeFormProps) {
  const [picked, setPicked] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const togglePick = (opt: string) =>
    setPicked((cur) =>
      cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt],
    );

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setFiles((cur) => [...cur, ...Array.from(list)]);
    setSubmitted(false);
  };

  const removeFile = (index: number) =>
    setFiles((cur) => cur.filter((_, i) => i !== index));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {quickPicks && (
        <fieldset>
          <legend className="text-sm font-medium">{quickPicks.label}</legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {quickPicks.options.map((opt) => {
              const active = picked.includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => togglePick(opt)}
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
      )}

      {textField && (
        <div>
          <label htmlFor="af-text" className="text-sm font-medium">
            {textField.label}
          </label>
          {textField.hint && (
            <p className="mt-1 text-xs text-stone-500">{textField.hint}</p>
          )}
          <textarea
            id="af-text"
            rows={7}
            placeholder={textField.placeholder}
            className={`mt-2 resize-y ${inputClass}`}
          />
        </div>
      )}

      {urlField && (
        <div>
          <label htmlFor="af-url" className="text-sm font-medium">
            {urlField.label}
          </label>
          {urlField.hint && (
            <p className="mt-1 text-xs text-stone-500">{urlField.hint}</p>
          )}
          <input
            id="af-url"
            type="url"
            inputMode="url"
            placeholder={urlField.placeholder ?? "https://"}
            className={`mt-2 ${inputClass}`}
          />
        </div>
      )}

      {fileField && (
        <div>
          <span className="text-sm font-medium">{fileField.label}</span>
          {fileField.hint && (
            <p className="mt-1 text-xs text-stone-500">{fileField.hint}</p>
          )}
          <label
            htmlFor="af-file"
            className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500 transition-colors hover:border-stone-400 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
          >
            <span aria-hidden className="text-lg">
              ＋
            </span>
            <span>
              點這裡選擇檔案
              {fileField.multiple ? "（可多選）" : ""}
            </span>
            <input
              id="af-file"
              type="file"
              accept={fileField.accept}
              multiple={fileField.multiple}
              onChange={(event) => addFiles(event.target.files)}
              className="hidden"
            />
          </label>
          {files.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-stone-200 px-3 py-2 text-sm dark:border-stone-800"
                >
                  <span className="min-w-0 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="shrink-0 text-xs text-stone-500 transition-colors hover:text-stone-900 dark:hover:text-white"
                  >
                    移除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-3 pt-1">
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-stone-900 px-5 text-sm font-medium text-white transition-colors hover:bg-stone-700 sm:w-auto dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
        >
          {submitLabel}
        </button>
        {submitted && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
            介面已完成，AI 分析功能還在開發中。你輸入的內容只留在這個瀏覽器分頁，不會被送出或儲存。
          </p>
        )}
      </div>
    </form>
  );
}
