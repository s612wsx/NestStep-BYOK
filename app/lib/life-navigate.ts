import OpenAI from "openai";
import { openAiClient } from "@/app/lib/openai-client";
import type {
  LifeGuidance,
  LifeFeatureKey,
} from "@/app/lib/life-query-types";

const DEFAULT_MODEL = "gpt-5-mini";

const SYSTEM_PROMPT = `你是 NestStep 的「生活問題導航」助理，服務對象是第一次自己生活、遇到不知道怎麼分類或不知道下一步該怎麼做的生活問題的人。

你不是聊天機器人，也不要回答與生活求助無關的問題。你不是專業人士，不要替使用者做法律、醫療、電氣、結構或其他專業判斷；需要專業判斷時，明確請使用者找對應的專業人員。

請只根據使用者的描述與（如果有）照片，用繁體中文整理成：

- detectedCategory：這比較像哪一類問題（用一到兩句話清楚說明，例如「這比較像社區公共區域的維護問題」）。
- safetyAlert：是否涉及「立即安全風險」，例如疑似瓦斯外洩、電線冒煙或燒焦味、大量漏水接近電器、結構明顯異常等。hasRisk 為 true 時，note 要明確提醒使用者「先停止自行處理」並「尋求適當的緊急協助（如撥打 119 / 通報瓦斯或電力公司 / 離開現場）」。沒有明顯風險時 hasRisk 為 false、note 為空字串。
- firstSteps：使用者現在可以先做什麼（安全、簡單、不需專業工具的步驟，例如拍照存證、關某個開關、詢問特定對象、查特定資料）。
- whoToContact：建議找誰協助（who 是對象，例如房東、社區管委會 / 管理室、水電 / 家電維修、里長 / 區公所、原廠客服、消防或警察等；why 說明為什麼找這個對象）。
- suggestedFeature：判斷這個問題是否更適合轉到 NestStep 既有功能做更完整處理。feature 從以下擇一：
  - "renting"：和看房、租屋廣告、租約條件本身有關
  - "repairs"：家中設備 / 管線 / 電器壞了、故障、漏水、跳電等
  - "documents"：看不懂某份文件 / 合約 / 規約 / 報價單
  - "bills"：帳單、費用怎麼算、費用有疑問
  - "moving"：搬家的準備與流程
  - "none"：都不特別適合，留在這裡即可
  reason 用一句話說明為什麼建議（或為什麼留在這裡）。

只根據提供的資訊判斷，不要杜撰。若某個陣列區塊沒有內容，回傳空陣列。`;

const SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    detectedCategory: {
      type: "string",
      description: "這比較像哪一類問題，一到兩句話",
    },
    safetyAlert: {
      type: "object",
      additionalProperties: false,
      properties: {
        hasRisk: { type: "boolean" },
        note: {
          type: "string",
          description: "有風險時的緊急提醒；沒有風險時為空字串",
        },
      },
      required: ["hasRisk", "note"],
    },
    firstSteps: {
      type: "array",
      description: "現在可以先做什麼",
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
    suggestedFeature: {
      type: "object",
      additionalProperties: false,
      properties: {
        feature: {
          type: "string",
          enum: ["renting", "repairs", "documents", "bills", "moving", "none"],
        },
        reason: { type: "string" },
      },
      required: ["feature", "reason"],
    },
  },
  required: [
    "detectedCategory",
    "safetyAlert",
    "firstSteps",
    "whoToContact",
    "suggestedFeature",
  ],
};

export type LifeNavigateInput = {
  description: string;
  quickPrompt?: string;
  /** 已上傳到 Blob 的圖片 URL，讓 AI 直接分析 */
  imageUrl?: string | null;
};

export type LifeNavigateOutput = {
  detectedCategory: string;
  guidance: LifeGuidance;
};

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function normalizeContacts(v: unknown): { who: string; why: string }[] {
  if (!Array.isArray(v)) return [];
  const out: { who: string; why: string }[] = [];
  for (const raw of v) {
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

const FEATURE_KEYS: LifeFeatureKey[] = [
  "renting",
  "repairs",
  "documents",
  "bills",
  "moving",
  "none",
];

function normalize(parsed: unknown): LifeNavigateOutput {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  const safety = (obj.safetyAlert ?? {}) as Record<string, unknown>;
  const sf = (obj.suggestedFeature ?? {}) as Record<string, unknown>;
  const feature = FEATURE_KEYS.includes(sf.feature as LifeFeatureKey)
    ? (sf.feature as LifeFeatureKey)
    : "none";

  return {
    detectedCategory: str(obj.detectedCategory),
    guidance: {
      safetyAlert: {
        hasRisk: safety.hasRisk === true,
        note: str(safety.note),
      },
      firstSteps: toStringArray(obj.firstSteps),
      whoToContact: normalizeContacts(obj.whoToContact),
      suggestedFeature: { feature, reason: str(sf.reason) },
    },
  };
}

/** 把使用者的生活問題（文字 + 選填圖片）交給 OpenAI 做「生活問題導航」*/
export async function navigateLifeQuery(
  apiKey: string,
  input: LifeNavigateInput,
): Promise<LifeNavigateOutput> {
  const openai = openAiClient(apiKey);
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const lines: string[] = [];
  if (input.quickPrompt?.trim()) {
    lines.push(`使用者選的快速提示：${input.quickPrompt.trim()}`);
  }
  lines.push("使用者的問題描述：", input.description.trim());
  if (input.imageUrl) {
    lines.push("", "使用者附上一張照片，請一併分析。");
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
        name: "life_navigation",
        strict: true,
        schema: SCHEMA,
      },
    },
    max_output_tokens: 16_000,
  });

  if (response.status === "incomplete") {
    const reason = response.incomplete_details?.reason ?? "unknown";
    throw new Error(
      reason === "max_output_tokens"
        ? "AI 回應太長被截斷，請縮短描述再試一次"
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
