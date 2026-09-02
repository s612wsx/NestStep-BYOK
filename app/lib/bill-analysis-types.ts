// 「帳單 / 費用有問題」共用型別。
// 此檔不得 import server-only 套件（openai / mongoose），前後端都會用到。

export const BILL_TYPES = [
  "電費",
  "水費",
  "瓦斯費",
  "管理費",
  "網路 / 電信",
  "維修費",
  "其他",
] as const;

export type BillType = (typeof BILL_TYPES)[number];

export type BillInputType = "pdf" | "image" | "text";

export const BILL_INPUT_TYPE_LABEL: Record<BillInputType, string> = {
  pdf: "PDF",
  image: "圖片",
  text: "貼上文字",
};

/** 有上傳 PDF 時的 Blob 資訊 */
export type BillFileMeta = {
  url: string;
  fileName: string;
};

/** 費用明細的單項 */
export type BillFeeItem = { label: string; amount: string };

/** 需要注意 / 再確認的地方 */
export type BillUnclearItem = { point: string; note: string };

export type BillAnalysisResult = {
  /** 帳單摘要：這是什麼帳單、計費期間、本期總金額等 */
  billSummary: string;
  /** 費用明細：白話整理各項費用與金額 */
  feeItems: BillFeeItem[];
  /** 金額怎麼組成：本期費用主要由哪些項目構成；資訊不足時明說無法確認 */
  amountBreakdown: string;
  /** 需要注意或再確認的地方 */
  unclearPoints: BillUnclearItem[];
  /** 建議詢問的問題 */
  questionsToAsk: string[];
};

/** POST /api/bills/analyze 的成功回應 */
export type BillAnalyzeResponse = {
  id: string;
  title: string;
  billType: string;
  inputType: BillInputType;
  /** 有上傳 PDF 時的 Blob 資訊，否則 null */
  file: BillFileMeta | null;
  /** 本期總金額，無法可靠取得時為 null */
  amount: number | null;
  /** 計費期間（YYYY-MM-DD），無法可靠取得時為 null */
  billingStartDate: string | null;
  billingEndDate: string | null;
  analysisResult: BillAnalysisResult;
  createdAt: string;
};

/** GET /api/bills/history 的單筆列表項目 */
export type BillHistoryItem = {
  id: string;
  title: string;
  billType: string;
  inputType: BillInputType;
  amount: number | null;
  createdAt: string;
};

/** GET /api/bills/history/[id] 的單筆詳情 */
export type BillHistoryDetail = {
  id: string;
  title: string;
  billType: string;
  inputType: BillInputType;
  originalText: string;
  fileUrl: string;
  fileName: string;
  amount: number | null;
  billingStartDate: string | null;
  billingEndDate: string | null;
  analysisResult: BillAnalysisResult;
  createdAt: string;
};
