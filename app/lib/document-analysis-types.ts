// 「我看不懂這份文件」共用型別（分析結果 + 歷史紀錄）。
// 此檔不得 import server-only 套件（openai / mongoose），前後端都會用到。

export type DocumentInputType = "pdf" | "text";

/** 有上傳 PDF 時的 Blob 資訊 */
export type DocumentFileMeta = {
  url: string;
  fileName: string;
};

/** 重要條件：金額、期限、付款方式、限制、違約、解約、責任、保固等 */
export type DocumentKeyTerm = { label: string; value: string };

/** 白話翻譯：原文重點 → 白話說法 */
export type DocumentPlainItem = { original: string; plain: string };

/** 沒說清楚 / 容易忽略的地方 */
export type DocumentUnclearItem = { point: string; note: string };

export type DocumentAnalysisResult = {
  /** 文件摘要：用簡單白話說明這份文件主要在講什麼 */
  documentSummary: string;
  /** 重要條件 */
  keyTerms: DocumentKeyTerm[];
  /** 白話翻譯 */
  plainLanguage: DocumentPlainItem[];
  /** 沒說清楚 / 容易忽略的地方 */
  unclearPoints: DocumentUnclearItem[];
  /** 建議再確認的問題 */
  questionsToAsk: string[];
};

/** POST /api/documents/analyze 的成功回應 */
export type DocumentAnalyzeResponse = {
  id: string;
  title: string;
  documentType: string;
  inputType: DocumentInputType;
  /** 有上傳 PDF 時的 Blob 資訊，否則 null */
  file: DocumentFileMeta | null;
  analysisResult: DocumentAnalysisResult;
  createdAt: string;
};

/** GET /api/documents/history 的單筆列表項目 */
export type DocumentHistoryItem = {
  id: string;
  title: string;
  documentType: string;
  inputType: DocumentInputType;
  createdAt: string;
};

/** GET /api/documents/history/[id] 的單筆詳情 */
export type DocumentHistoryDetail = {
  id: string;
  title: string;
  documentType: string;
  inputType: DocumentInputType;
  originalText: string;
  fileUrl: string;
  fileName: string;
  analysisResult: DocumentAnalysisResult;
  createdAt: string;
};
