// 「我要租房 / 看房」共用型別（檔案上傳結果 + AI 分析結果）
// 這個檔案不能 import 任何 server-only 套件（openai / mongoose），前後端都會用到。

export type RentingInputType = "text" | "url" | "file";

/** 檔案上傳到 Vercel Blob 成功後回傳的資訊 */
export type UploadedFileMeta = {
  url: string;
  pathname: string;
  fileName: string;
  size: number;
  contentType: string;
};


// ── AI 分析結果 ────────────────────────────────────────────────
// AI 不評斷物件好壞、不替使用者做決定，只客觀整理下列五個面向。

/** 已經明確提供的事實 */
export type RentingFact = { label: string; value: string };

/** 模糊、可能造成誤解或缺乏明確數字的表述 */
export type RentingVagueStatement = {
  /** 原文中的說法 */
  quote: string;
  /** 為什麼模糊或可能誤解 */
  issue: string;
};

/** 有條件才能成立的描述 */
export type RentingConditionalClaim = {
  /** 廣告 / 文件的說法 */
  quote: string;
  /** 需要滿足什麼條件才成立 */
  condition: string;
};

export type RentingAnalysisResult = {
  /** 已經明確提供的事實 */
  clearFacts: RentingFact[];
  /** 模糊、可能造成誤解或缺乏明確數字的表述 */
  vagueStatements: RentingVagueStatement[];
  /** 沒有說清楚、但值得確認的資訊 */
  missingInfo: string[];
  /** 有條件才能成立的描述 */
  conditionalClaims: RentingConditionalClaim[];
  /** 建議向房東 / 仲介 / 建商進一步詢問的問題 */
  questionsToAsk: string[];
};

/** POST /api/renting/analyze 的成功回應（完整送出流程） */
export type RentingAnalyzeResponse = {
  /** MongoDB 紀錄 id */
  id: string;
  title: string;
  inputType: RentingInputType;
  /** 有上傳檔案時的 Blob 資訊，否則為 null */
  file: UploadedFileMeta | null;
  analysisResult: RentingAnalysisResult;
  createdAt: string;
};

/** GET /api/renting/history 的單筆列表項目 */
export type RentingHistoryItem = {
  id: string;
  title: string;
  inputType: RentingInputType;
  createdAt: string;
};

/** GET /api/renting/history/[id] 的單筆詳情 */
export type RentingHistoryDetail = {
  id: string;
  title: string;
  inputType: RentingInputType;
  originalText: string;
  fileUrl: string;
  fileName: string;
  analysisResult: RentingAnalysisResult;
  createdAt: string;
};
