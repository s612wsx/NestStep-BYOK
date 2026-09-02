import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { HistoryList } from "./history-list";

export const metadata: Metadata = { title: "租屋分析紀錄" };

export default function RentingHistoryPage() {
  return (
    <div>
      <PageHeader emoji="🗂️" title="租屋分析紀錄">
        <p>你過去送出的租屋分析，只有你自己看得到。</p>
      </PageHeader>

      <div className="mb-6">
        <Link
          href="/renting"
          className="text-sm text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          ← 回到分析頁
        </Link>
      </div>

      <HistoryList />
    </div>
  );
}
