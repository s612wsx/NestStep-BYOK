import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const billAnalysisSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    // 使用者選的帳單類型，例如「電費」「網路 / 電信」
    billType: { type: String, required: true },
    // 使用者這次的輸入方式："pdf" | "text"
    inputType: { type: String, required: true },
    // 貼上的文字內容；只上傳 PDF 時可能為空
    originalText: { type: String, default: "" },
    // 只有貼文字時，fileUrl / fileName 留空
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    // 本期總金額；無法從資料可靠取得時為 null（不猜測）
    amount: { type: Number, default: null },
    // 計費期間；無法可靠取得時為 null
    billingStartDate: { type: Date, default: null },
    billingEndDate: { type: Date, default: null },
    // AI 分析結果（帳單摘要、費用明細、金額怎麼組成、需要注意的地方、建議詢問的問題）
    analysisResult: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type BillAnalysisDoc = InferSchemaType<typeof billAnalysisSchema>;

export const BillAnalysisModel: Model<BillAnalysisDoc> =
  (models.BillAnalysis as Model<BillAnalysisDoc>) ??
  model<BillAnalysisDoc>("BillAnalysis", billAnalysisSchema);
