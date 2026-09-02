import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8">
      <Link
        href="/start"
        className="inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-900 dark:hover:text-white"
      >
        <span aria-hidden>←</span> 回功能首頁
      </Link>

      <h1 className="mt-4 flex items-center gap-2.5 text-2xl font-semibold tracking-tight sm:text-[28px]">
        <span aria-hidden className="text-2xl">
          {emoji}
        </span>
        {title}
      </h1>

      {children && (
        <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-stone-600 dark:text-stone-400">
          {children}
        </div>
      )}
    </div>
  );
}
