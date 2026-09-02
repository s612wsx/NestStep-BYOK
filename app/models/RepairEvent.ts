import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const repairEventSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    // 使用者選的問題類型，例如「漏水」「跳電 / 沒電」
    category: { type: String, required: true },
    // 使用者的文字描述；只上傳照片時可能為空
    description: { type: String, default: "" },
    // AI 初步分診結果（結構化）
    aiTriageResult: { type: Schema.Types.Mixed, default: null },
    // 上傳照片的 Vercel Blob URL；沒有照片則為空字串
    photoUrl: { type: String, default: "" },
    // 事件狀態："open"（待處理）/ "in_progress"（處理中）/ "resolved"（已解決）
    status: { type: String, default: "open" },

    // ── 後續處理（第一次建立時不填，之後回來補）──────────────
    // 處理方式 / 維修結果
    resolution: { type: String, default: "" },
    // 找誰處理，例如 self / landlord / management / plumber / appliance / other
    handledBy: { type: String, default: "" },
    // 維修 / 處理費用，可留空
    cost: { type: Number, default: null },
    // 處理日期，可留空
    resolvedDate: { type: Date, default: null },
    // 備註，可留空
    note: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type RepairEventDoc = InferSchemaType<typeof repairEventSchema>;

export const RepairEventModel: Model<RepairEventDoc> =
  (models.RepairEvent as Model<RepairEventDoc>) ??
  model<RepairEventDoc>("RepairEvent", repairEventSchema);
