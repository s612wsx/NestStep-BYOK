import OpenAI from "openai";
import { openAiClient } from "@/app/lib/openai-client";
import type { RentingAnalysisResult } from "@/app/lib/renting-analysis-types";

// 可用 .env.local 的 OPENAI_MODEL 覆寫。
const DEFAULT_MODEL = "gpt-5-mini";

const SYSTEM_PROMPT = `你是協助「第一次自己租屋」的人看懂租屋資訊的助理。
使用者會提供租屋廣告、建案文案、從文件取得的文字，或直接上傳 PDF / 圖片（例如廣告截圖、合約、平面圖）。
若有附上檔案，請一併閱讀檔案裡的內容再分析。

你的角色不是判斷這個物件好或不好，也不要替使用者做決定或建議租不租。
請只根據提供的內容，客觀整理出以下五個面向，一律使用繁體中文：

1. clearFacts：已經明確提供的事實（有具體數字、名稱或條件的敘述）。
2. vagueStatements：模糊、可能造成誤解或缺乏明確數字的表述，並說明為什麼模糊。
3. missingInfo：內容沒有說清楚、但租屋前值得確認的資訊。
4. conditionalClaims：有前提或條件才能成立的描述，並指出那個條件。
5. questionsToAsk：建議使用者向房東、仲介或建商進一步詢問的問題。

不要杜撰沒有出現在內容裡的資訊。若某個面向沒有內容，回傳空陣列。`;

// Structured Outputs 的 JSON schema（strict：每個屬性都要在 required，且 additionalProperties:false）
const ANALYSIS_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    clearFacts: {
      type: "array",
      description: "已經明確提供的事實",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string", description: "這項事實的類別，例如租金、坪數、位置" },
          value: { type: "string", description: "內容中明確寫到的數值或敘述" },
        },
        required: ["label", "value"],
      },
    },
    vagueStatements: {
      type: "array",
      description: "模糊、可能造成誤解或缺乏明確數字的表述",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          quote: { type: "string", description: "原文中的說法" },
          issue: { type: "string", description: "為什麼模糊或可能被誤解" },
        },
        required: ["quote", "issue"],
      },
    },
    missingInfo: {
      type: "array",
      description: "沒有說清楚、但值得確認的資訊",
      items: { type: "string" },
    },
    conditionalClaims: {
      type: "array",
      description: "有條件才能成立的描述",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          quote: { type: "string", description: "廣告或文件的說法" },
          condition: { type: "string", description: "需要滿足什麼條件才成立" },
        },
        required: ["quote", "condition"],
      },
    },
    questionsToAsk: {
      type: "array",
      description: "建議向房東 / 仲介 / 建商進一步詢問的問題",
      items: { type: "string" },
    },
  },
  required: [
    "clearFacts",
    "vagueStatements",
    "missingInfo",
    "conditionalClaims",
    "questionsToAsk",
  ],
};

export type RentingAnalyzeFile = {
  /** 可公開存取的檔案 URL（Vercel Blob） */
  url: string;
  fileName: string;
  /** MIME type，例如 "application/pdf" 或 "image/png" */
  contentType: string;
};

export type RentingAnalyzeInput = {
  /** 要分析的文字內容；沒有檔案時必填 */
  content?: string;
  title?: string;
  sourceUrl?: string;
  /** 直接交給 AI 閱讀的 PDF / 圖片 */
  file?: RentingAnalyzeFile | null;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toPairArray<A extends string, B extends string>(
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

function normalizeResult(parsed: unknown): RentingAnalysisResult {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  return {
    clearFacts: toPairArray(obj.clearFacts, "label", "value"),
    vagueStatements: toPairArray(obj.vagueStatements, "quote", "issue"),
    missingInfo: toStringArray(obj.missingInfo),
    conditionalClaims: toPairArray(obj.conditionalClaims, "quote", "condition"),
    questionsToAsk: toStringArray(obj.questionsToAsk),
  };
}

/** 把使用者提供的租屋資訊（文字 / PDF / 圖片）交給 OpenAI，回傳結構化的分析結果 */
export async function analyzeRentingListing(
  apiKey: string,
  input: RentingAnalyzeInput,
): Promise<RentingAnalysisResult> {
  const openai = openAiClient(apiKey);
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const { file } = input;

  const lines: string[] = [];
  if (input.title?.trim()) lines.push(`物件標題：${input.title.trim()}`);
  if (input.sourceUrl?.trim()) lines.push(`來源網址：${input.sourceUrl.trim()}`);

  const text = input.content?.trim();
  if (text) {
    if (lines.length) lines.push("");
    lines.push("使用者提供的文字內容：", text);
  }
  if (file) {
    if (lines.length) lines.push("");
    lines.push(
      `另外附上一份檔案（${file.fileName}），請一併閱讀並分析裡面的內容。`,
    );
  }
  if (lines.length === 0) {
    lines.push("請分析下方附件檔案的內容。");
  }

  const content: OpenAI.Responses.ResponseInputContent[] = [
    { type: "input_text", text: lines.join("\n") },
  ];
  if (file?.contentType.startsWith("image/")) {
    // high：文件 / 合約截圖常有小字，需要較高解析度才讀得清楚
    content.push({ type: "input_image", detail: "high", image_url: file.url });
  } else if (file?.contentType === "application/pdf") {
    // 用 file_url 時不可同時帶 filename（OpenAI 視為互斥）
    content.push({ type: "input_file", file_url: file.url });
  }

  const response = await openai.responses.create({
    model,
    instructions: SYSTEM_PROMPT,
    input: [{ role: "user", content }],
    reasoning: { effort: "low" },
    text: {
      format: {
        type: "json_schema",
        name: "renting_analysis",
        strict: true,
        schema: ANALYSIS_SCHEMA,
      },
    },
    // reasoning model 會先花一部分 token 思考，留足空間避免 JSON 被截斷
    max_output_tokens: 16_000,
  });

  if (response.status === "incomplete") {
    const reason = response.incomplete_details?.reason ?? "unknown";
    throw new Error(
      reason === "max_output_tokens"
        ? "AI 回應太長被截斷，請縮短輸入內容或分次分析"
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
