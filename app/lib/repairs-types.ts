// 「家裡東西壞了」AI 初步分診的共用型別。
// 此檔不得 import server-only 套件（openai / mongoose），前後端都會用到。

export type RepairDangerLevel = "low" | "medium" | "high";

export type RepairContact = {
  /** 建議聯絡的對象，例如房東、管委會、水電師傅 */
  who: string;
  /** 為什麼找這個對象 */
  why: string;
};

export type RepairTriageResult = {
  /** 是否可能有立即危險 */
  immediateDanger: {
    level: RepairDangerLevel;
    summary: string;
  };
  /** 現在第一步可以做什麼 */
  firstSteps: string[];
  /** 可能屬於哪些類型的問題 */
  possibleCategories: string[];
  /** 有哪些事情不建議自行處理 */
  doNotDIY: string[];
  /** 建議找誰協助 */
  whoToContact: RepairContact[];
  /** 哪些情況下需要立即停止使用或尋求緊急協助 */
  stopUsingIf: string[];
};

/** POST /api/repairs/triage 的成功回應 */
export type RepairTriageResponse = {
  /** MongoDB 事件紀錄 id；若這次沒存成功則為 null */
  id: string | null;
  saved: boolean;
  category: string;
  /** 事件狀態，預設 "open"（待處理）*/
  status: string;
  triage: RepairTriageResult;
  /** 上傳照片的 Blob URL（沒有則為空字串）*/
  photoUrl: string;
  createdAt: string | null;
};

// ── 房子病歷：事件詳情與後續處理 ──────────────────────────────

/** 事件狀態 */
export type RepairStatus = "open" | "in_progress" | "resolved";

/** 找誰處理 */
export type RepairHandledBy =
  | ""
  | "self"
  | "landlord"
  | "management"
  | "plumber"
  | "appliance"
  | "other";

/** 後續處理欄位（第一次建立事件時不填）*/
export type RepairFollowUp = {
  /** 處理方式 / 維修結果 */
  resolution: string;
  /** 找誰處理 */
  handledBy: RepairHandledBy;
  /** 維修 / 處理費用，可留空 */
  cost: number | null;
  /** 處理日期（YYYY-MM-DD），可留空 */
  resolvedDate: string | null;
  /** 備註，可留空 */
  note: string;
};

/** GET /api/repairs/[id] 的事件詳情 */
export type RepairEventDetail = RepairFollowUp & {
  id: string;
  category: string;
  description: string;
  status: RepairStatus;
  aiTriageResult: RepairTriageResult | null;
  photoUrl: string;
  createdAt: string;
};

/** PATCH /api/repairs/[id] 的更新內容（皆為選填，只更新有帶的欄位）*/
export type RepairEventUpdateInput = Partial<
  RepairFollowUp & { status: RepairStatus }
>;

/** GET /api/repairs 的單筆列表項目 */
export type RepairEventListItem = {
  id: string;
  category: string;
  status: RepairStatus;
  hasPhoto: boolean;
  createdAt: string;
};
