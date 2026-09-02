import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { HistoryDetail } from "./history-detail";

export const metadata: Metadata = { title: "租屋分析紀錄" };

export default async function RentingHistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <PageHeader emoji="🗂️" title="租屋分析紀錄" />
      <HistoryDetail id={id} />
    </div>
  );
}
