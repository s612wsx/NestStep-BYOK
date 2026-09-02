import OpenAI from "openai";
import type {
  RepairTriageResult,
  RepairDangerLevel,
} from "@/app/lib/repairs-types";

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

const SYSTEM_PROMPT = `你是協助「第一次自己住」的人處理家中突發狀況的助理，任務是「初步分診」。

你不是專業水電、家電或消防人員，也不要假裝是。不要斷定故障的確切原因，也不要給詳細的維修步驟。
請根據使用者選的問題類型、文字描述，以及（如果有）照片，用繁體中文整理出下列固定區塊：

1. immediateDanger：這個狀況「是否可能」有立即危險（例如觸電、火災、瓦斯外洩、淹水、結構問題）。level 用 low / medium / high，summary 一句話說明理由。資訊不足時，往較保守（medium 以上）的方向評估。
2. firstSteps：現在第一步可以做什麼（安全、簡單、不需專業工具的處置，例如關某個開關、關水閥、開窗通風、拍照存證）。
3. possibleCategories：這個狀況可能屬於哪些類型的問題（提供方向，不是斷定原因）。
4. doNotDIY：有哪些事情「不建議自行處理」，以免危險或讓情況變糟。
5. whoToContact：建議找誰協助（例如房東、社區管委會 / 管理室、水電師傅、家電原廠 / 特約維修、台電 / 自來水公司 / 瓦斯公司、119）。who 是對象，why 說明為什麼找這個對象。
6. stopUsingIf：哪些情況下需要立即停止使用該設備，或尋求緊急協助（撥打 119 / 112、通報瓦斯公司等）。

只根據提供的資訊判斷，不要杜撰。若某個陣列區塊沒有內容，回傳空陣列（immediateDanger 一律要填）。`;

// Structured Outputs 的 JSON schema（strict：每個屬性都要在 required，且 additionalProperties:false）
const TRIAGE_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    immediateDanger: {
      type: "object",
      additionalProperties: false,
      description: "是否可能有立即危險",
      properties: {
        level: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "立即危險的大致程度",
        },
        summary: { type: "string", description: "一句話說明為什麼是這個程度" },
      },
      required: ["level", "summary"],
    },
    firstSteps: {
      type: "array",
      description: "現在第一步可以做什麼",
      items: { type: "string" },
    },
    possibleCategories: {
      type: "array",
      description: "可能屬於哪些類型的問題",
      items: { type: "string" },
    },
    doNotDIY: {
      type: "array",
      description: "不建議自行處理的事",
      items: { type: "string" },
    },
    whoToContact: {
      type: "array",
      description: "建議找誰協助",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          who: { type: "string" },
          why: { type: "string" },
        },
        required: ["who", "why"],
      },
    },
    stopUsingIf: {
      type: "array",
      description: "需要立即停用或尋求緊急協助的情況",
      items: { type: "string" },
    },
  },
  required: [
    "immediateDanger",
    "firstSteps",
    "possibleCategories",
    "doNotDIY",
    "whoToContact",
    "stopUsingIf",
  ],
};

export type RepairTriageInput = {
  category: string;
  description?: string;
  /** 已上傳到 Blob 的照片 URL，讓 AI 直接讀取 */
  imageUrl?: string | null;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeLevel(value: unknown): RepairDangerLevel {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : "medium";
}

function normalizeContacts(value: unknown): { who: string; why: string }[] {
  if (!Array.isArray(value)) return [];
  const out: { who: string; why: string }[] = [];
  for (const raw of value) {
    const item = raw as Record<string, unknown>;
    if (item && typeof item.who === "string") {
      out.push({
        who: item.who,
        why: typeof item.why === "string" ? item.why : "",
      });
    }
  }
  return out;
}

function normalizeResult(parsed: unknown): RepairTriageResult {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  const danger = (obj.immediateDanger ?? {}) as Record<string, unknown>;
  return {
    immediateDanger: {
      level: normalizeLevel(danger.level),
      summary: typeof danger.summary === "string" ? danger.summary : "",
    },
    firstSteps: toStringArray(obj.firstSteps),
    possibleCategories: toStringArray(obj.possibleCategories),
    doNotDIY: toStringArray(obj.doNotDIY),
    whoToContact: normalizeContacts(obj.whoToContact),
    stopUsingIf: toStringArray(obj.stopUsingIf),
  };
}

/** 把使用者回報的家中狀況交給 OpenAI 做初步分診，回傳結構化結果 */
export async function triageRepair(
  input: RepairTriageInput,
): Promise<RepairTriageResult> {
  const openai = getClient();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const lines: string[] = [`使用者選的問題類型：${input.category}`];
  if (input.description?.trim()) {
    lines.push("", "使用者的描述：", input.description.trim());
  }
  if (input.imageUrl) {
    lines.push("", "使用者附上一張照片，請一併參考。");
  }

  const content: OpenAI.Responses.ResponseInputContent[] = [
    { type: "input_text", text: lines.join("\n") },
  ];
  if (input.imageUrl) {
    content.push({
      type: "input_image",
      detail: "high",
      image_url: input.imageUrl,
    });
  }

  const response = await openai.responses.create({
    model,
    instructions: SYSTEM_PROMPT,
    input: [{ role: "user", content }],
    reasoning: { effort: "low" },
    text: {
      format: {
        type: "json_schema",
        name: "repair_triage",
        strict: true,
        schema: TRIAGE_SCHEMA,
      },
    },
    max_output_tokens: 16_000,
  });

  if (response.status === "incomplete") {
    const reason = response.incomplete_details?.reason ?? "unknown";
    throw new Error(
      reason === "max_output_tokens"
        ? "AI 回應太長被截斷，請把描述縮短再試一次"
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

  return normalizeResult(parsed);
}
