import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { DocumentsForm } from "./documents-form";

export const metadata: Metadata = { title: "我看不懂這份文件" };

export default function DocumentsPage() {
  return (
    <div>
      <PageHeader emoji="📄" title="我看不懂這份文件">
        <p>
          上傳 PDF，或直接貼上文字。租約、電信 / 網路合約、管理規約、維修報價單、保固條款或其他生活文件都可以。
        </p>
        <p>
          AI 會整理成：文件摘要、重要條件、白話翻譯、沒說清楚 /
          容易忽略的地方，以及建議再確認的問題。AI
          只做客觀整理與解釋，不會告訴你「要不要簽」、「好不好」或「有沒有問題」。分析結果會存起來。
        </p>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link
          href="/documents/history"
          className="text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          查看文件分析紀錄 →
        </Link>
        <Link
          href="/demo?feature=documents"
          className="text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          看這個功能的範例 →
        </Link>
      </div>

      <DocumentsForm />
    </div>
  );
}
