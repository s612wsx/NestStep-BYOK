import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { BillHistoryDetailView } from "./history-detail";

export const metadata: Metadata = { title: "帳單分析紀錄" };

export default async function BillHistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <PageHeader emoji="🗂️" title="帳單分析紀錄" />
      <BillHistoryDetailView id={id} />
    </div>
  );
}
