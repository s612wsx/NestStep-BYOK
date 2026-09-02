import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { OtherHistoryList } from "./history-list";

export const metadata: Metadata = { title: "生活問題紀錄" };

export default function OtherHistoryPage() {
  return (
    <div>
      <PageHeader emoji="🗂️" title="生活問題紀錄">
        <p>你問過的生活問題，只有你自己看得到。</p>
      </PageHeader>

      <div className="mb-6">
        <Link
          href="/other"
          className="text-sm text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          ← 回到問問題
        </Link>
      </div>

      <OtherHistoryList />
    </div>
  );
}
