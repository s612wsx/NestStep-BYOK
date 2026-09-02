import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const lifeQuerySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    // 使用者的問題描述
    description: { type: String, required: true },
    // 使用者選的快速提示（選填）
    quickPrompt: { type: String, default: "" },
    // 上傳圖片的 Vercel Blob 資訊；沒有圖片則為空字串
    imageUrl: { type: String, default: "" },
    imagePathname: { type: String, default: "" },
    // AI 判斷「這比較像哪一類問題」
    detectedCategory: { type: String, default: "" },
    // AI 導航結果（安全提醒、現在可做什麼、找誰協助、是否轉到其他功能）
    aiGuidance: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type LifeQueryDoc = InferSchemaType<typeof lifeQuerySchema>;

export const LifeQueryModel: Model<LifeQueryDoc> =
  (models.LifeQuery as Model<LifeQueryDoc>) ??
  model<LifeQueryDoc>("LifeQuery", lifeQuerySchema);
