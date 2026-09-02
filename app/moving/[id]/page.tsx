import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { MovePlanView } from "./move-plan-view";

export const metadata: Metadata = { title: "搬家計畫" };

export default async function MovePlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <PageHeader emoji="📦" title="搬家計畫" />
      <MovePlanView id={id} />
    </div>
  );
}
