import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const rentingAnalysisSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    // 使用者這次是用哪種方式提供資料："text" | "url" | "file"
    inputType: { type: String, required: true },
    // 貼上的租屋廣告 / 建案文案 / 網址 / 文字；只上傳檔案時可能為空
    originalText: { type: String, default: "" },
    // 只貼文字、沒有上傳檔案時，fileUrl / fileName 留空
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    // AI 分析結果（整理後的資訊、模糊話術、待核實項目、可詢問的問題等）
    analysisResult: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type RentingAnalysisDoc = InferSchemaType<typeof rentingAnalysisSchema>;

export const RentingAnalysisModel: Model<RentingAnalysisDoc> =
  (models.RentingAnalysis as Model<RentingAnalysisDoc>) ??
  model<RentingAnalysisDoc>("RentingAnalysis", rentingAnalysisSchema);
