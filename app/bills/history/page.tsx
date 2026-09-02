import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { BillsHistoryList } from "./history-list";

export const metadata: Metadata = { title: "帳單分析紀錄" };

export default function BillsHistoryPage() {
  return (
    <div>
      <PageHeader emoji="🗂️" title="帳單分析紀錄">
        <p>你分析過的帳單，只有你自己看得到。</p>
      </PageHeader>

      <div className="mb-6">
        <Link
          href="/bills"
          className="text-sm text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          ← 回到分析頁
        </Link>
      </div>

      <BillsHistoryList />
    </div>
  );
}
