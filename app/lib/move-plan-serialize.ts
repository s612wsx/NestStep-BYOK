import type { MovePlanDetail } from "@/app/lib/move-plan-types";

type RawChecklistItem = {
  _id: unknown;
  title: string;
  phase: string;
  completed?: boolean;
  custom?: boolean;
};

export type RawMovePlan = {
  _id: unknown;
  moveDate: Date | string;
  housingType: string;
  movingCompany: string;
  largeFurniture?: string[];
  pet: string;
  internetSetup: string;
  moveOutStatus: string;
  purchaseNeeds?: string[];
  additionalNotes?: string;
  checklistItems?: RawChecklistItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
};

/** mongoose 文件（lean 或 hydrated）→ 前端用的 MovePlanDetail */
export function serializePlanDetail(plan: RawMovePlan): MovePlanDetail {
  return {
    id: String(plan._id),
    moveDate: new Date(plan.moveDate).toISOString().slice(0, 10),
    housingType: plan.housingType,
    movingCompany: plan.movingCompany,
    largeFurniture: plan.largeFurniture ?? [],
    pet: plan.pet,
    internetSetup: plan.internetSetup,
    moveOutStatus: plan.moveOutStatus,
    purchaseNeeds: plan.purchaseNeeds ?? [],
    additionalNotes: plan.additionalNotes ?? "",
    checklistItems: (plan.checklistItems ?? []).map((it) => ({
      id: String(it._id),
      title: it.title,
      phase: it.phase as MovePlanDetail["checklistItems"][number]["phase"],
      completed: Boolean(it.completed),
      custom: Boolean(it.custom),
    })),
    createdAt: new Date(plan.createdAt).toISOString(),
    updatedAt: new Date(plan.updatedAt).toISOString(),
  };
}
