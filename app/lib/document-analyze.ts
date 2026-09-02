import OpenAI from "openai";
import type {
  DocumentAnalysisResult,
  DocumentKeyTerm,
  DocumentPlainItem,
  DocumentUnclearItem,
} from "@/app/lib/document-analysis-types";

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

const SYSTEM_PROMPT = `你是協助一般人「看懂生活中的文件」的助理。文件可能是租約、電信 / 網路合約、社區管理規約、維修報價單、保固條款或其他生活文件。

你的目標不是做法律判斷，也不要告訴使用者「要不要簽」、「好不好」或「有沒有問題」。
請只客觀整理、解釋，並提醒哪些地方值得再確認，一律使用繁體中文，整理成以下欄位：

- title：用一句話幫這份文件下一個簡短標題。
- documentType：這份文件的類型（例如：住宅租賃契約、電信服務合約、社區管理規約、維修報價單、保固條款、其他）。
- documentSummary：用簡單白話說明這份文件主要在講什麼。
- keyTerms：整理文件裡的重要條件——金額、期限、付款方式、限制、違約、解約、責任、保固或其他重要條件。label 是條件類別，value 是內容。
- plainLanguage：把難懂、專業或冗長的內容改寫成一般人容易理解的說法。original 是原文重點或段落大意，plain 是白話說法。
- unclearPoints：指出模糊表述、附帶條件、例外、限制或資訊缺口。point 是簡述，note 說明為什麼值得注意。
- questionsToAsk：產生使用者可以向對方（房東 / 業者 / 廠商等）進一步詢問的具體問題。

只根據文件內容整理，不要杜撰。若某個陣列區塊沒有內容，回傳空陣列。`;

const ANALYSIS_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "一句話的文件標題" },
    documentType: { type: "string", description: "文件類型" },
    documentSummary: {
      type: "string",
      description: "用簡單白話說明這份文件主要在講什麼",
    },
    keyTerms: {
      type: "array",
      description: "重要條件",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string", description: "條件類別，例如金額、期限、違約" },
          value: { type: "string", description: "該條件的內容" },
        },
        required: ["label", "value"],
      },
    },
    plainLanguage: {
      type: "array",
      description: "白話翻譯",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          original: { type: "string", description: "原文重點或段落大意" },
          plain: { type: "string", description: "白話說法" },
        },
        required: ["original", "plain"],
      },
    },
    unclearPoints: {
      type: "array",
      description: "沒說清楚 / 容易忽略的地方",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          point: { type: "string", description: "模糊、附帶條件、例外、限制或缺口的簡述" },
          note: { type: "string", description: "為什麼值得注意" },
        },
        required: ["point", "note"],
      },
    },
    questionsToAsk: {
      type: "array",
      description: "建議向對方進一步詢問的具體問題",
      items: { type: "string" },
    },
  },
  required: [
    "title",
    "documentType",
    "documentSummary",
    "keyTerms",
    "plainLanguage",
    "unclearPoints",
    "questionsToAsk",
  ],
};

export type DocumentAnalyzeInput = {
  /** 貼上的文字內容（沒有 PDF 時必填）*/
  content?: string;
  /** 已上傳到 Blob 的 PDF URL，讓 AI 直接讀取 */
  fileUrl?: string | null;
};

export type DocumentAnalyzeOutput = {
  aiTitle: string;
  documentType: string;
  result: DocumentAnalysisResult;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
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

function normalize(parsed: unknown): DocumentAnalyzeOutput {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  return {
    aiTitle: str(obj.title),
    documentType: str(obj.documentType),
    result: {
      documentSummary: str(obj.documentSummary),
      keyTerms: toPairs(obj.keyTerms, "label", "value") as DocumentKeyTerm[],
      plainLanguage: toPairs(
        obj.plainLanguage,
        "original",
        "plain",
      ) as DocumentPlainItem[],
      unclearPoints: toPairs(
        obj.unclearPoints,
        "point",
        "note",
      ) as DocumentUnclearItem[],
      questionsToAsk: toStringArray(obj.questionsToAsk),
    },
  };
}

/** 把文件（PDF 或文字）交給 OpenAI，回傳結構化分析結果 */
export async function analyzeDocument(
  input: DocumentAnalyzeInput,
): Promise<DocumentAnalyzeOutput> {
  const openai = getClient();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const content: OpenAI.Responses.ResponseInputContent[] = [];
  const text = input.content?.trim();
  if (text) {
    content.push({
      type: "input_text",
      text: `請分析以下文件內容：\n\n${text}`,
    });
  } else {
    content.push({ type: "input_text", text: "請分析附件這份 PDF 文件。" });
  }
  if (input.fileUrl) {
    // 用 file_url 時不可同時帶 filename
    content.push({ type: "input_file", file_url: input.fileUrl });
  }

  const response = await openai.responses.create({
    model,
    instructions: SYSTEM_PROMPT,
    input: [{ role: "user", content }],
    reasoning: { effort: "low" },
    text: {
      format: {
        type: "json_schema",
        name: "document_analysis",
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
        ? "AI 回應太長被截斷，請縮短內容或分段分析"
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
