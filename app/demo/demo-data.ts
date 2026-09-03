// 範例頁用的假資料。全部是預先寫好的內容，沒有經過 AI，也不會存進資料庫。
// 型別直接沿用各功能的正式結果型別，範例畫面才會跟真的一模一樣。

import type { RentingAnalysisResult } from "@/app/lib/renting-analysis-types";
import type { RepairTriageResult } from "@/app/lib/repairs-types";
import type { BillAnalysisResult } from "@/app/lib/bill-analysis-types";
import type { DocumentAnalysisResult } from "@/app/lib/document-analysis-types";
import type { LifeGuidance } from "@/app/lib/life-query-types";
import type { PhaseKey } from "@/app/lib/move-plan-types";
import type { FeatureSlug } from "@/lib/features";

/** 一個「重點導覽」項目：點了會聚焦到結果的第 blockIndex 個區塊 */
export type Callout = {
  /** 顯示的數字 */
  n: number;
  /** 要聚焦結果卡裡第幾個區塊（從 0 起算）*/
  blockIndex: number;
  /** 一句話：這個區塊在幫使用者做什麼 */
  label: string;
};

export type DemoMeta = {
  /** 結果卡標題，模擬真實使用時的物件 / 檔案名稱 */
  sampleTitle: string;
  /** 標題下方那行小字 */
  note: string;
};

// ── 租房 / 看房 ────────────────────────────────────────────────

export const rentingSample: RentingAnalysisResult = {
  clearFacts: [
    { label: "租金", value: "每月 18,000 元，另收管理費 1,500 元" },
    { label: "坪數", value: "室內 12 坪、權狀 15 坪" },
    { label: "位置", value: "中正區，屋主寫「鄰近捷運站」" },
    { label: "押金", value: "兩個月租金" },
    { label: "格局", value: "2 房 1 廳 1 衛，含一間面公園" },
  ],
  vagueStatements: [
    {
      quote: "近捷運、生活機能佳",
      issue: "沒寫是哪一站、實際步行幾分鐘；「機能佳」也沒有具體說明附近有什麼。",
    },
    {
      quote: "全新裝潢、採光極佳",
      issue: "沒說裝潢完成時間，也沒有列出實際附的家具家電；採光沒有講座向或樓層。",
    },
  ],
  missingInfo: [
    "有沒有提供停車位、費用是另計還是內含",
    "電費是台電計價，還是房東自訂每度單價",
    "是否可以遷入戶籍、報稅",
    "有沒有綁約期，提前解約如何計算違約金",
  ],
  conditionalClaims: [
    {
      quote: "可短期租賃",
      condition: "需經房東同意，且短租期間租金另議",
    },
  ],
  questionsToAsk: [
    "月租 18,000 元有含管理費、網路費嗎？",
    "電費每度多少錢？夏季會不會不一樣？",
    "房子最近一次裝潢或油漆是什麼時候？",
    "可以簽一年約嗎？押金退還的條件是什麼？",
  ],
};

// ── 家裡東西壞了 ──────────────────────────────────────────────

export const repairsSample: RepairTriageResult = {
  immediateDanger: {
    level: "medium",
    summary:
      "廚房水槽下方持續漏水，短時間內不至於危險，但要盡快關閉該處水閥，避免泡壞櫃體或滲到樓下。",
  },
  firstSteps: [
    "打開水槽下方櫃門，找到冷熱水的角凡而（牆面出水口的小開關），順時針關到底",
    "用毛巾或水桶接住還在滴的水，把櫃內物品移出、擦乾",
    "拍幾張漏水位置的照片，記下開始漏的時間",
    "用文字訊息通知房東或管理室，說明狀況並保留紀錄",
  ],
  possibleCategories: [
    "角凡而或進水軟管老化滲水",
    "水槽落水頭 / 存水彎接縫鬆脫",
    "淨水器接頭滲水",
  ],
  doNotDIY: [
    "自行拆換牆內水管",
    "在不確定總水閥位置時，硬轉已經生鏽的閥件",
  ],
  whoToContact: [
    {
      who: "房東 / 二房東",
      why: "固定管線與設備的維修責任通常在房東，要先通知並保留紀錄",
    },
    {
      who: "水電師傅",
      why: "角凡而、進水軟管更換屬簡單維修；若房東同意，可自行找師傅處理後憑單據請款",
    },
  ],
  stopUsingIf: [
    "關了角凡而仍持續大量出水",
    "水已滲到插座、電器，或樓下天花板出現水痕",
  ],
};

/** 維修：送出分診時會自動建立的事件（狀態一開始是「待處理」）*/
export const repairsEventDemo = {
  category: "漏水",
  createdAtLabel: "2026/09/03 23:40 建立",
};

/**
 * 維修：問題解決後回到那筆事件補上的「後續處理」。
 * 一開始這些欄位都是空的，處理完才回來填、按儲存 —— 累積成「房子病歷」。
 */
export const repairsFollowUpDemo = {
  resolution:
    "找水電師傅來看，是進水軟管和角凡而老化，兩件一起換新，漏水停止；換好後觀察兩天沒有再滲水。",
  handledBy: "水電師傅",
  cost: "600 元",
  resolvedDate: "2026/09/06",
  note: "收據已拍照留存，房東同意從下期房租扣抵。",
};

// ── 我看不懂這份文件 ─────────────────────────────────────────

export const documentsSample: DocumentAnalysisResult = {
  documentSummary:
    "這是一份住宅租賃契約書，約定房東將房屋出租給承租人，租期一年，內容包含租金、押金、修繕責任、提前解約與違約金等條款。",
  keyTerms: [
    { label: "租期", value: "2026/10/01 至 2027/09/30，共一年" },
    { label: "租金", value: "每月 20,000 元，每月 5 日前繳納" },
    { label: "押金", value: "40,000 元，租期屆滿且無欠費時退還" },
    {
      label: "提前解約",
      value: "須於一個月前書面通知，並賠償一個月租金作為違約金",
    },
    {
      label: "修繕責任",
      value: "結構與固定設備由房東負責；使用不當造成的損壞由承租人負責",
    },
  ],
  plainLanguage: [
    {
      original:
        "乙方不得於租賃期間將房屋全部或一部分轉租、出借或以其他變相方法由他人使用。",
      plain:
        "你不能把房子（整間或其中一個房間）再租給別人、借給別人，或用其他方式讓別人住。",
    },
    {
      original:
        "本契約期滿後，乙方應即遷讓交還房屋，不得藉詞推諉或主張任何權利。",
      plain: "約到期就要搬走、把房子還給房東，不能找理由拖延。",
    },
  ],
  unclearPoints: [
    {
      point: "「固定設備」沒有列清單",
      note: "冷氣、熱水器、洗衣機算不算「固定設備」會影響壞掉時誰付錢，建議簽約時附上設備清單與現況照片。",
    },
    {
      point: "續約條件沒有寫",
      note: "沒有提到到期後如何續約、租金會不會調整，最好先問清楚。",
    },
  ],
  questionsToAsk: [
    "「固定設備」具體包含哪些？可以附一份清單嗎？",
    "一年到期後想續租的話，租金會調整嗎？",
    "提前解約的「一個月通知」，是從哪一天開始算？",
  ],
};

// ── 帳單 / 費用有問題 ─────────────────────────────────────────

export const billsSample: BillAnalysisResult = {
  billSummary:
    "這是一張台電電費通知單，計費期間 2026/06/20 至 2026/08/19（約 60 天），本期電費合計 2,480 元，用電 420 度，落在夏季電價、採累進計費。",
  feeItems: [
    { label: "流動電費（分段累進）", amount: "2,210 元" },
    { label: "基本電費", amount: "196 元" },
    { label: "公共設施分攤", amount: "74 元" },
    { label: "本期應繳總金額", amount: "2,480 元" },
  ],
  amountBreakdown:
    "本期金額主要來自流動電費 2,210 元，約佔 89%。因為落在 6～9 月的夏季電價，每度單價較高，且 420 度已進入較高的累進級距，是金額偏高的主因。",
  unclearPoints: [
    {
      point: "「公共設施分攤」74 元怎麼算的",
      note: "帳單沒有說明分攤比例或依據；如果是分租套房，值得向房東確認計算方式。",
    },
    {
      point: "沒有逐段列出電價單價",
      note: "只有總額，看不到每個累進級距各用了多少度、單價多少，無法自己核對。",
    },
  ],
  questionsToAsk: [
    "這是台電原始帳單，還是房東轉開的？每度電多少錢？",
    "「公共設施分攤」的 74 元是怎麼分的？",
    "夏季電價到幾月結束？下一期會不會降？",
  ],
};

// ── 其他生活問題 ──────────────────────────────────────────────

export const otherSample: {
  detectedCategory: string;
  guidance: LifeGuidance;
} = {
  detectedCategory: "比較像「家裡東西壞了」的維修 / 權責問題",
  guidance: {
    safetyAlert: { hasRisk: false, note: "" },
    firstSteps: [
      "拍照記錄天花板滲水的位置與範圍，註明發現時間",
      "把滲水下方的家具、電器移開，地上鋪毛巾或放水桶",
      "看看是不是樓上住戶或公共管線的問題；如果是，同時通知管委會",
      "用文字（LINE 或簡訊）通知房東，保留已通知的紀錄",
    ],
    whoToContact: [
      {
        who: "房東",
        why: "非人為的滲水通常屬於房東的修繕責任，要先通知並請他安排處理",
      },
      {
        who: "公寓大廈管理委員會",
        why: "如果滲水源自公共管線或頂樓防水層，修繕與費用由管委會負責",
      },
    ],
    suggestedFeature: {
      feature: "repairs",
      reason:
        "這個狀況需要判斷危險程度和維修權責，用「家裡東西壞了」可以得到更完整的初步分診。",
    },
  },
};

// ── 我要搬家 ──────────────────────────────────────────────────

export type MovingSampleItem = {
  title: string;
  phase: PhaseKey;
  completed: boolean;
};

export const movingSample: MovingSampleItem[] = [
  { phase: "before_30", title: "確認搬家日期，向房東提出退租通知", completed: true },
  { phase: "before_30", title: "比價並預約搬家公司", completed: true },
  {
    phase: "before_30",
    title: "盤點大型家具，決定要搬 / 要丟 / 要賣",
    completed: false,
  },
  { phase: "before_14", title: "申請新家網路，預約安裝時間", completed: false },
  { phase: "before_14", title: "開始打包非日常用品", completed: false },
  { phase: "before_7", title: "辦理郵局改址（郵件轉寄）服務", completed: false },
  { phase: "before_7", title: "通知銀行、電信、訂閱服務更新地址", completed: false },
  { phase: "before_1", title: "冰箱除霜、清空並擦乾", completed: false },
  {
    phase: "move_day",
    title: "搬家前後拍照記錄舊家屋況（退押金依據）",
    completed: false,
  },
  { phase: "move_day", title: "抄下新家的水錶、電錶、瓦斯錶度數", completed: false },
  { phase: "after", title: "搬入 14 天內辦理戶籍遷入", completed: false },
  { phase: "after", title: "確認舊家押金退還金額與時間", completed: false },
];

// ── 每個功能的「重點導覽」 ───────────────────────────────────
// blockIndex 對應結果卡裡 <div class="space-y-7"> 底下第幾個子區塊。

export const calloutsByFeature: Record<FeatureSlug, Callout[]> = {
  renting: [
    { n: 1, blockIndex: 0, label: "把散在廣告裡的租金、坪數、押金條件抓出來，一次看完。" },
    {
      n: 2,
      blockIndex: 1,
      label: "標出「近捷運」「全新裝潢」這種聽起來很好、其實沒講清楚的說法。",
    },
    { n: 3, blockIndex: 2, label: "列出廣告沒提、但簽約前你該自己確認的事。" },
    { n: 4, blockIndex: 3, label: "直接生出可以複製、貼給房東問的問題。" },
  ],
  repairs: [
    {
      n: 1,
      blockIndex: 0,
      label: "送出分診就自動存成「待處理」事件，不用另外按儲存，之後在紀錄裡找得到。",
    },
    {
      n: 2,
      blockIndex: 1,
      label:
        "AI 當下的初步分診：有沒有立即危險、第一步做什麼、不要自己動手的事、該找誰。",
    },
    {
      n: 3,
      blockIndex: 2,
      label:
        "問題解決後回到這筆事件，補上處理方式、找誰、費用、日期，累積成你的「房子病歷」。",
    },
  ],
  documents: [
    { n: 1, blockIndex: 1, label: "把散在條文裡的租期、租金、違約金、修繕責任挑出來。" },
    { n: 2, blockIndex: 2, label: "一句句法律文字翻成白話，看得懂在講什麼。" },
    { n: 3, blockIndex: 3, label: "指出合約沒寫清楚、之後容易吵的地方。" },
  ],
  bills: [
    { n: 1, blockIndex: 1, label: "把帳單上每一筆費用拆開、對齊金額。" },
    { n: 2, blockIndex: 2, label: "說明這期為什麼比較貴（夏季電價、累進級距）。" },
    { n: 3, blockIndex: 3, label: "點出算不出來、該跟房東或台電確認的收費。" },
  ],
  moving: [
    { n: 1, blockIndex: 1, label: "依你的搬家日，排出「還有一個月」該做的事。" },
    { n: 2, blockIndex: 5, label: "當天才要做的事單獨一組，不會漏掉抄水電錶。" },
    { n: 3, blockIndex: 6, label: "搬完還沒結束——戶籍、押金也幫你列進去。" },
  ],
  other: [
    { n: 1, blockIndex: 0, label: "先判斷你這個問題比較像哪一類。" },
    { n: 2, blockIndex: 1, label: "不知道從哪開始時，給你現在能做的第一步。" },
    { n: 3, blockIndex: 3, label: "告訴你接下來轉去哪個功能處理比較完整。" },
  ],
};

export const demoMeta: Record<FeatureSlug, DemoMeta> = {
  renting: { sampleTitle: "範例：中正區 2 房 面公園", note: "貼上租屋廣告文字後的整理結果" },
  repairs: {
    sampleTitle: "範例：廚房水槽下方漏水",
    note: "送出即建立「待處理」事件，問題解決後可回來補完，存成房子病歷",
  },
  documents: { sampleTitle: "範例：住宅租賃契約書", note: "上傳 PDF 後的白話整理" },
  bills: { sampleTitle: "範例：台電電費通知單", note: "上傳帳單後的費用拆解" },
  moving: { sampleTitle: "範例：2026/10/15 搬家", note: "填完搬家情況後產生的客製清單" },
  other: { sampleTitle: "範例：天花板滲水，不知道該找誰", note: "描述問題後的初步導航" },
};
