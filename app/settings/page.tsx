import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "設定 · OpenAI 金鑰" };

export default function SettingsPage() {
  return (
    <div>
      <PageHeader emoji="⚙️" title="設定">
        <p>
          NestStep 的 AI 分析改由你自己的 OpenAI
          金鑰驅動。貼上金鑰、驗證通過後就能開始使用各項功能。
        </p>
        <p>分析會用你自己的 OpenAI 額度計費。</p>
      </PageHeader>

      <SettingsForm />
    </div>
  );
}
