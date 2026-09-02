import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { RepairEventDetailView } from "./repair-event-detail";

export const metadata: Metadata = { title: "事件詳情" };

export default async function RepairEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <PageHeader emoji="🔧" title="事件詳情" />
      <RepairEventDetailView id={id} />
    </div>
  );
}
