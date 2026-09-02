import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const documentAnalysisSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    // AI 判斷的文件類型，例如「住宅租賃契約」「電信服務合約」
    documentType: { type: String, default: "" },
    // 使用者這次的輸入方式："pdf" | "text"
    inputType: { type: String, required: true },
    // 貼上的文字內容；只上傳 PDF 時可能為空
    originalText: { type: String, default: "" },
    // 只有貼文字時，fileUrl / fileName 留空
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    // AI 分析結果（文件摘要、重要條件、白話翻譯、沒說清楚的地方、建議詢問的問題）
    analysisResult: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type DocumentAnalysisDoc = InferSchemaType<typeof documentAnalysisSchema>;

export const DocumentAnalysisModel: Model<DocumentAnalysisDoc> =
  (models.DocumentAnalysis as Model<DocumentAnalysisDoc>) ??
  model<DocumentAnalysisDoc>("DocumentAnalysis", documentAnalysisSchema);
