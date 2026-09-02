import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MovingForm } from "./moving-form";

export const metadata: Metadata = { title: "我要搬家" };

export default function MovingPage() {
  return (
    <div>
      <PageHeader emoji="📦" title="我要搬家">
        <p>
          填一下搬家日期和你的情況，AI 會依此排一份實用、按時間排序的搬家
          Checklist，之後你可以回來勾選進度、自己增修項目。
        </p>
      </PageHeader>

      <div className="mb-6">
        <Link
          href="/moving/plans"
          className="text-sm text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          查看我的搬家計畫 →
        </Link>
      </div>

      <MovingForm />
    </div>
  );
}
