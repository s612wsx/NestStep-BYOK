import OpenAI from "openai";
import type {
  BillAnalysisResult,
  BillFeeItem,
  BillUnclearItem,
} from "@/app/lib/bill-analysis-types";

// 可用 .env.local 的 OPENAI_MODEL 覆寫。
const DEFAULT_MODEL = "gpt-5-mini";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("環境變數缺少 OPENAI_API_KEY");
  }
  client ??= new OpenAI({ apiKey });
  return client;
}

const SYSTEM_PROMPT = `你是協助「第一次自己生活」的人看懂帳單、理解費用怎麼計算的助理。帳單可能是電費、水費、瓦斯費、社區管理費、網路 / 電信費、維修費或其他費用單。

你的角色不是判定「帳單錯誤」、「被多收費」，也不要替使用者與業者下結論。
請只客觀協助使用者理解帳單內容，並指出需要進一步確認的地方，一律使用繁體中文，整理成以下欄位：

- title：用一句話幫這張帳單下一個簡短標題。
- amount：本期應繳總金額（純數字，新臺幣）。只有在帳單中能可靠讀到時才填，否則為 null，不要猜測。
- billingStartDate / billingEndDate：計費期間的起訖日，格式 YYYY-MM-DD。只有能可靠讀到時才填，否則為 null。
- billSummary：帳單摘要——這是什麼帳單、計費期間、本期總金額等重要資訊。
- feeItems：費用明細——用白話整理帳單中各項費用以及金額。label 是項目名稱，amount 是金額（讀不到就寫「未列出」或「無法確認」）。
- amountBreakdown：金額怎麼組成——解釋本期費用主要由哪些項目構成。如果文件資訊不足以說明，就明確說「文件資訊不足，無法確認組成」，不要自行猜測比例或金額。
- unclearPoints：需要注意或再確認的地方——不清楚的費用、額外收費、費率變化、計費期間差異、模糊項目等。若帳單包含前期資料，可以客觀比較本期與前期的差異，但不要直接判斷為「異常」。point 是簡述，note 說明為什麼值得確認。
- questionsToAsk：建議使用者向房東、管理公司、電信業者、公用事業單位、維修人員或其他相關對象詢問的具體問題。

只根據帳單內容整理，不要杜撰。若某個陣列區塊沒有內容，回傳空陣列。`;

const ANALYSIS_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "一句話的帳單標題" },
    amount: {
      type: ["number", "null"],
      description: "本期應繳總金額，無法可靠讀到時為 null",
    },
    billingStartDate: {
      type: ["string", "null"],
      description: "計費期間開始日 YYYY-MM-DD，無法可靠讀到時為 null",
    },
    billingEndDate: {
      type: ["string", "null"],
      description: "計費期間結束日 YYYY-MM-DD，無法可靠讀到時為 null",
    },
    billSummary: {
      type: "string",
      description: "這是什麼帳單、計費期間、本期總金額等",
    },
    feeItems: {
      type: "array",
      description: "費用明細",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string", description: "費用項目名稱" },
          amount: { type: "string", description: "金額，讀不到寫「未列出」或「無法確認」" },
        },
        required: ["label", "amount"],
      },
    },
    amountBreakdown: {
      type: "string",
      description: "本期費用由哪些項目構成；資訊不足就說無法確認，不要猜測",
    },
    unclearPoints: {
      type: "array",
      description: "需要注意或再確認的地方",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          point: { type: "string", description: "不清楚或值得確認之處的簡述" },
          note: { type: "string", description: "為什麼值得確認" },
        },
        required: ["point", "note"],
      },
    },
    questionsToAsk: {
      type: "array",
      description: "建議向相關對象詢問的具體問題",
      items: { type: "string" },
    },
  },
  required: [
    "title",
    "amount",
    "billingStartDate",
    "billingEndDate",
    "billSummary",
    "feeItems",
    "amountBreakdown",
    "unclearPoints",
    "questionsToAsk",
  ],
};

export type BillAnalyzeInput = {
  billType: string;
  content?: string;
  /** 已上傳到 Blob 的檔案，讓 AI 直接讀取（PDF 或圖片）*/
  file?: { url: string; isImage: boolean } | null;
};

export type BillAnalyzeOutput = {
  aiTitle: string;
  amount: number | null;
  billingStartDate: string | null;
  billingEndDate: string | null;
  result: BillAnalysisResult;
};

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toPairs<A extends string, B extends string>(
  value: unknown,
  keyA: A,
  keyB: B,
): Record<A | B, string>[] {
  if (!Array.isArray(value)) return [];
  const out: Record<A | B, string>[] = [];
  for (const raw of value) {
    const item = raw as Record<string, unknown>;
    if (!item || typeof item[keyA] !== "string") continue;
    out.push({
      [keyA]: String(item[keyA]),
      [keyB]: typeof item[keyB] === "string" ? String(item[keyB]) : "",
    } as Record<A | B, string>);
  }
  return out;
}

/** 只接受能真正解析的日期字串，否則回 null（不猜測）*/
function safeDateString(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const t = Date.parse(value);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

function safeAmount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalize(parsed: unknown): BillAnalyzeOutput {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  return {
    aiTitle: str(obj.title),
    amount: safeAmount(obj.amount),
    billingStartDate: safeDateString(obj.billingStartDate),
    billingEndDate: safeDateString(obj.billingEndDate),
    result: {
      billSummary: str(obj.billSummary),
      feeItems: toPairs(obj.feeItems, "label", "amount") as BillFeeItem[],
      amountBreakdown: str(obj.amountBreakdown),
      unclearPoints: toPairs(
        obj.unclearPoints,
        "point",
        "note",
      ) as BillUnclearItem[],
      questionsToAsk: toStringArray(obj.questionsToAsk),
    },
  };
}

/** 把帳單（PDF 或文字）交給 OpenAI，回傳結構化分析結果 */
export async function analyzeBill(
  input: BillAnalyzeInput,
): Promise<BillAnalyzeOutput> {
  const openai = getClient();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const content: OpenAI.Responses.ResponseInputContent[] = [];
  const text = input.content?.trim();
  const lead = `使用者選的帳單類型：${input.billType}`;
  if (text) {
    content.push({
      type: "input_text",
      text: `${lead}\n\n請分析以下帳單內容：\n\n${text}`,
    });
  } else {
    content.push({
      type: "input_text",
      text: `${lead}\n\n請分析附件這份帳單（可能是 PDF 或圖片）。`,
    });
  }
  if (input.file?.isImage) {
    // 帳單照片常有小字，需要較高解析度才讀得清楚
    content.push({
      type: "input_image",
      detail: "high",
      image_url: input.file.url,
    });
  } else if (input.file) {
    content.push({ type: "input_file", file_url: input.file.url });
  }

  const response = await openai.responses.create({
    model,
    instructions: SYSTEM_PROMPT,
    input: [{ role: "user", content }],
    reasoning: { effort: "low" },
    text: {
      format: {
        type: "json_schema",
        name: "bill_analysis",
        strict: true,
        schema: ANALYSIS_SCHEMA,
      },
    },
    max_output_tokens: 16_000,
  });

  if (response.status === "incomplete") {
    const reason = response.incomplete_details?.reason ?? "unknown";
    throw new Error(
      reason === "max_output_tokens"
        ? "AI 回應太長被截斷，請縮短內容再試一次"
        : `AI 沒有完成回應（${reason}）`,
    );
  }

  const raw = response.output_text?.trim();
  if (!raw) {
    throw new Error("AI 沒有回傳可用的內容");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI 回傳的內容無法解析為 JSON");
  }

  return normalize(parsed);
}
