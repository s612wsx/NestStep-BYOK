import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { RepairsEventsList } from "./repairs-events-list";

export const metadata: Metadata = { title: "維修事件紀錄" };

export default function RepairsEventsPage() {
  return (
    <div>
      <PageHeader emoji="🗂️" title="維修事件紀錄">
        <p>你回報過的家中狀況，只有你自己看得到。點進去可以查看分診結果，並補充後續處理。</p>
      </PageHeader>

      <div className="mb-6">
        <Link
          href="/repairs"
          className="text-sm text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          ← 回報新的問題
        </Link>
      </div>

      <RepairsEventsList />
    </div>
  );
}
