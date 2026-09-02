import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { RentingForm } from "./renting-form";

export const metadata: Metadata = { title: "我要租房 / 看房" };

export default function RentingPage() {
  return (
    <div>
      <PageHeader emoji="🏠" title="我要租房 / 看房">
        <p>
          貼上租屋廣告、建案文案的文字，或直接上傳 PDF /
          圖片（廣告截圖、合約、平面圖都可以），送出後 AI 會閱讀內容並分成四區整理：
        </p>
        <p>
          已明確提供的資訊、沒說清楚 / 模糊的地方、建議核實的資訊，以及建議進一步詢問的問題。AI
          只做客觀整理，不會用「好 / 壞」或「安全 / 危險」替你下結論。分析結果會連同原始內容與檔案一起存起來。
        </p>
      </PageHeader>

      <div className="mb-6">
        <Link
          href="/renting/history"
          className="text-sm text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          查看你的分析紀錄 →
        </Link>
      </div>

      <RentingForm />
    </div>
  );
}
