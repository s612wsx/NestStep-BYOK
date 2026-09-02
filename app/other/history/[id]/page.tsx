import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { OtherHistoryDetailView } from "./history-detail";

export const metadata: Metadata = { title: "生活問題紀錄" };

export default async function OtherHistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <PageHeader emoji="🗂️" title="生活問題紀錄" />
      <OtherHistoryDetailView id={id} />
    </div>
  );
}
