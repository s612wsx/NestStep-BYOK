import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MovingPlansList } from "./moving-plans-list";

export const metadata: Metadata = { title: "我的搬家計畫" };

export default function MovingPlansPage() {
  return (
    <div>
      <PageHeader emoji="📦" title="我的搬家計畫">
        <p>你建立過的搬家計畫，只有你自己看得到。點進去可以繼續勾選 Checklist。</p>
      </PageHeader>

      <div className="mb-6">
        <Link
          href="/moving"
          className="text-sm text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          ← 建立新的搬家計畫
        </Link>
      </div>

      <MovingPlansList />
    </div>
  );
}
