import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { DocumentHistoryDetailView } from "./history-detail";

export const metadata: Metadata = { title: "文件分析紀錄" };

export default async function DocumentHistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <PageHeader emoji="🗂️" title="文件分析紀錄" />
      <DocumentHistoryDetailView id={id} />
    </div>
  );
}
