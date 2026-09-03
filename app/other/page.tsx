import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { OtherForm } from "./other-form";

export const metadata: Metadata = { title: "其他生活問題" };

export default function OtherPage() {
  return (
    <div>
      <PageHeader emoji="❓" title="其他生活問題">
        <p>
          遇到不知道怎麼分類、或不知道下一步該怎麼做的生活狀況，從這裡描述，需要的話附一張照片。
        </p>
        <p>
          AI 會做「生活問題導航」：判斷這比較像哪一類問題、現在可以先做什麼、建議找誰協助，以及是不是更適合轉到
          NestStep 其他功能處理。涉及專業判斷的部分它不會替你下結論。分析結果會存起來。
        </p>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link
          href="/other/history"
          className="text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          查看我問過的問題 →
        </Link>
        <Link
          href="/demo?feature=other"
          className="text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          看這個功能的範例 →
        </Link>
      </div>

      <OtherForm />
    </div>
  );
}
