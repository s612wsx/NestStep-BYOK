import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { RepairsForm } from "./repairs-form";

export const metadata: Metadata = { title: "家裡東西壞了" };

export default function RepairsPage() {
  return (
    <div>
      <PageHeader emoji="🔧" title="家裡東西壞了">
        <p>選一個最接近的問題類型，描述狀況，需要的話上傳一張照片。</p>
        <p>
          AI 會做「初步分診」：有沒有立即危險、第一步可以做什麼、可能是哪一類問題、哪些事不要自己動手、該找誰，以及什麼情況要立刻停用或求助。這不是專業診斷。送出後會自動幫你留一筆待處理紀錄，不用另外按儲存。
        </p>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link
          href="/repairs/events"
          className="text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          查看維修事件紀錄 →
        </Link>
        <Link
          href="/demo?feature=repairs"
          className="text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          看這個功能的範例 →
        </Link>
      </div>

      <RepairsForm />
    </div>
  );
}
