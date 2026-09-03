import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { BillsForm } from "./bills-form";

export const metadata: Metadata = { title: "帳單 / 費用有問題" };

export default function BillsPage() {
  return (
    <div>
      <PageHeader emoji="💸" title="帳單 / 費用有問題">
        <p>
          先選帳單類型，再上傳 PDF / 圖片，或直接貼上帳單文字。電費、水費、瓦斯費、管理費、網路
          / 電信、維修費或其他都可以。
        </p>
        <p>
          AI 會整理成：帳單摘要、費用明細、金額怎麼組成、需要注意或再確認的地方，以及建議詢問的問題。AI
          只客觀協助你理解帳單，不會判定「帳單錯了」、「被多收費」或替你和業者下結論。分析結果會存起來。
        </p>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link
          href="/bills/history"
          className="text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          查看帳單分析紀錄 →
        </Link>
        <Link
          href="/demo?feature=bills"
          className="text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          看這個功能的範例 →
        </Link>
      </div>

      <BillsForm />
    </div>
  );
}
