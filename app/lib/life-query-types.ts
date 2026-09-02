// 「其他生活問題」共用型別與選項。
// 此檔不得 import server-only 套件（openai / mongoose），前後端都會用到。

export const QUICK_PROMPTS = [
  "不知道該找誰",
  "不知道這是什麼",
  "不知道要不要處理",
  "不知道是不是房東負責",
  "不知道下一步怎麼做",
  "其他",
] as const;

export type LifeFeatureKey =
  | "renting"
  | "repairs"
  | "documents"
  | "bills"
  | "moving"
  | "none";

export const FEATURE_LABEL: Record<LifeFeatureKey, string> = {
  renting: "我要租房 / 看房",
  repairs: "家裡東西壞了",
  documents: "我看不懂這份文件",
  bills: "帳單 / 費用有問題",
  moving: "我要搬家",
  none: "",
};

export const FEATURE_PATH: Record<
  Exclude<LifeFeatureKey, "none">,
  string
> = {
  renting: "/renting",
  repairs: "/repairs",
  documents: "/documents",
  bills: "/bills",
  moving: "/moving",
};

export type LifeContact = { who: string; why: string };

export type LifeGuidance = {
  /** 是否涉及立即安全風險 */
  safetyAlert: { hasRisk: boolean; note: string };
  /** 現在可以先做什麼 */
  firstSteps: string[];
  /** 建議找誰協助 */
  whoToContact: LifeContact[];
  /** 是否適合轉到 NestStep 其他功能 */
  suggestedFeature: { feature: LifeFeatureKey; reason: string };
};

/** POST /api/other/analyze 的成功回應 */
export type LifeQueryResponse = {
  id: string;
  description: string;
  quickPrompt: string;
  imageUrl: string;
  imagePathname: string;
  /** 這比較像哪一類問題（AI 判斷）*/
  detectedCategory: string;
  aiGuidance: LifeGuidance;
  createdAt: string;
};

/** GET /api/other/history 的單筆列表項目 */
export type LifeQueryHistoryItem = {
  id: string;
  description: string;
  detectedCategory: string;
  hasImage: boolean;
  createdAt: string;
};

/** GET /api/other/history/[id] 的單筆詳情 */
export type LifeQueryHistoryDetail = LifeQueryResponse;
