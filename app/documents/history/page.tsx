import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { DocumentsHistoryList } from "./history-list";

export const metadata: Metadata = { title: "文件分析紀錄" };

export default function DocumentsHistoryPage() {
  return (
    <div>
      <PageHeader emoji="🗂️" title="文件分析紀錄">
        <p>你分析過的文件，只有你自己看得到。</p>
      </PageHeader>

      <div className="mb-6">
        <Link
          href="/documents"
          className="text-sm text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          ← 回到分析頁
        </Link>
      </div>

      <DocumentsHistoryList />
    </div>
  );
}
