import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { features, type FeatureSlug } from "@/lib/features";
import { AnalysisSections } from "@/app/renting/analysis-sections";
import { BillAnalysisSections } from "@/app/bills/analysis-sections";
import { DocumentAnalysisSections } from "@/app/documents/analysis-sections";
import { GuidanceSections } from "@/app/other/guidance-sections";
import { StaticChecklist } from "./static-checklist";
import { RepairsDemo } from "./repairs-demo";
import { DemoExplorer } from "./demo-explorer";
import {
  rentingSample,
  repairsSample,
  repairsEventDemo,
  repairsFollowUpDemo,
  billsSample,
  documentsSample,
  otherSample,
  movingSample,
  demoMeta,
  calloutsByFeature,
} from "./demo-data";

export const metadata: Metadata = { title: "功能範例" };

// 六個功能的範例結果：直接用各功能正式的結果元件渲染假資料，
// 範例畫面才會跟真的使用結果完全一致。
const nodes: Record<FeatureSlug, ReactNode> = {
  renting: <AnalysisSections result={rentingSample} />,
  repairs: (
    <RepairsDemo
      category={repairsEventDemo.category}
      createdAtLabel={repairsEventDemo.createdAtLabel}
      triage={repairsSample}
      followUp={repairsFollowUpDemo}
    />
  ),
  documents: <DocumentAnalysisSections result={documentsSample} />,
  bills: <BillAnalysisSections result={billsSample} />,
  moving: <StaticChecklist items={movingSample} />,
  other: (
    <GuidanceSections
      detectedCategory={otherSample.detectedCategory}
      guidance={otherSample.guidance}
    />
  ),
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string }>;
}) {
  const sp = await searchParams;
  const initialFeature: FeatureSlug =
    features.find((f) => f.slug === sp.feature)?.slug ?? "renting";

  return (
    <div>
      <PageHeader emoji="🔍" title="看看 NestStep 幫你整理完長什麼樣">
        <p>
          下面是六個功能的<strong>範例結果</strong>
          ，內容是預先準備的假資料，沒有經過 AI、也不用登入。
          點結果各區塊的數字，看這個功能實際會為你做什麼。
        </p>
        <p>
          想用自己的資料跑一次，再{" "}
          <Link
            href="/register"
            className="font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900 dark:text-stone-200 dark:hover:text-white"
          >
            註冊
          </Link>{" "}
          並到設定貼上自己的 OpenAI 金鑰即可。
        </p>
      </PageHeader>

      <DemoExplorer
        nodes={nodes}
        meta={demoMeta}
        callouts={calloutsByFeature}
        initialFeature={initialFeature}
      />
    </div>
  );
}
