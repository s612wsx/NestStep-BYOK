// 「我要搬家」共用型別與選項。
// 此檔不得 import server-only 套件（openai / mongoose），前後端都會用到。

export const HOUSING_TYPES = [
  "租屋",
  "自有住宅",
  "與家人同住",
  "宿舍",
  "其他",
] as const;

export const MOVING_COMPANY_OPTIONS = ["需要", "不需要", "還不確定"] as const;

export const LARGE_FURNITURE_OPTIONS = [
  "床",
  "沙發",
  "衣櫃",
  "書桌",
  "冰箱",
  "洗衣機",
  "其他大型家具",
  "沒有",
] as const;
export const LARGE_FURNITURE_NONE = "沒有";

export const PET_OPTIONS = ["沒有", "狗", "貓", "其他"] as const;

export const INTERNET_OPTIONS = ["需要", "不需要", "已經申請"] as const;

export const MOVE_OUT_OPTIONS = ["需要", "不需要", "不適用"] as const;

export const PURCHASE_OPTIONS = [
  "家具",
  "寢具",
  "廚房用品",
  "清潔用品",
  "浴室用品",
  "收納用品",
  "家電",
  "不需要",
] as const;
export const PURCHASE_NONE = "不需要";

export const PHASES = [
  { key: "before_30", label: "搬家前 30 天" },
  { key: "before_14", label: "搬家前 14 天" },
  { key: "before_7", label: "搬家前 7 天" },
  { key: "before_1", label: "搬家前 1 天" },
  { key: "move_day", label: "搬家當天" },
  { key: "after", label: "搬家後" },
] as const;

export type PhaseKey = (typeof PHASES)[number]["key"];
export const PHASE_KEYS = PHASES.map((p) => p.key) as PhaseKey[];
export const PHASE_LABEL: Record<PhaseKey, string> = Object.fromEntries(
  PHASES.map((p) => [p.key, p.label]),
) as Record<PhaseKey, string>;

export type MoveChecklistItem = {
  id: string;
  title: string;
  phase: PhaseKey;
  completed: boolean;
  /** true = 使用者自己新增的（可修改標題）*/
  custom: boolean;
};

/** 建立搬家計畫時填的欄位 */
export type MovePlanInput = {
  /** YYYY-MM-DD */
  moveDate: string;
  housingType: string;
  movingCompany: string;
  largeFurniture: string[];
  pet: string;
  internetSetup: string;
  moveOutStatus: string;
  purchaseNeeds: string[];
  additionalNotes: string;
};

/** GET /api/moving/[id] 的搬家計畫詳情 */
export type MovePlanDetail = MovePlanInput & {
  id: string;
  checklistItems: MoveChecklistItem[];
  createdAt: string;
  updatedAt: string;
};

/** GET /api/moving 的單筆列表項目 */
export type MovePlanListItem = {
  id: string;
  moveDate: string;
  housingType: string;
  totalItems: number;
  completedItems: number;
  createdAt: string;
};

/** PATCH /api/moving/[id] 的操作 */
export type MovePlanPatchAction =
  | { action: "toggle"; itemId: string; completed: boolean }
  | { action: "add"; title: string; phase: PhaseKey }
  | { action: "edit"; itemId: string; title: string }
  | { action: "remove"; itemId: string };
