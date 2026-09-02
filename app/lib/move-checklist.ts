import { openAiClient } from "@/app/lib/openai-client";
import {
  PHASE_KEYS,
  type MovePlanInput,
  type PhaseKey,
} from "@/app/lib/move-plan-types";

const DEFAULT_MODEL = "gpt-5-mini";

const SYSTEM_PROMPT = `你是協助「第一次自己搬家」的人的助理。請依照使用者的搬家日期與實際情況，產生一份實用、具體、按時間排序的搬家 Checklist。

規則：
- 每個項目用簡短、明確、可以直接執行的一句話，不要寫成長篇說明。
- 依使用者的情況調整內容，不相關的條件不要硬塞：
  - 需要搬家公司 → 加入找搬家公司、比較 / 確認報價、預約搬家時間等。
  - 有大型家具 → 加入丈量尺寸、規劃搬運動線、確認電梯 / 樓梯 / 樓層等。
  - 有寵物 → 加入寵物搬家準備（外出籠、安撫、就醫紀錄、到新家先安置一個房間等）。
  - 需要申請新家網路 → 加入查方案、預約申辦、預約裝機、當天確認上網。
  - 需要辦理舊家退租 → 加入提前通知房東、約定房屋點交、拍照存證、抄水電瓦斯表、歸還鑰匙、確認押金退還方式。
  - 需要添購物品 → 依使用者選的分類（家具 / 寢具 / 廚房用品 / 清潔用品 / 浴室用品 / 收納用品 / 家電）加入採購與到貨時間安排。
  - 有「其他補充情況」時，把相關準備也排進去。
- 涉及租約、押金、退租責任等需要依個別契約判斷的事項，不要直接做法律判斷，只提醒使用者「確認自己的契約內容」或「向房東 / 房仲 / 管理單位核實」。
- phase 只能是：before_30（搬家前 30 天）、before_14（搬家前 14 天）、before_7（搬家前 7 天）、before_1（搬家前 1 天）、move_day（搬家當天）、after（搬家後）。
- 一律使用繁體中文。整份清單大約 20～40 項，六個階段都要有內容。`;

const SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      description: "按時間排序的搬家待辦",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: {
            type: "string",
            description: "簡短、明確、可直接執行的一句話",
          },
          phase: {
            type: "string",
            enum: [
              "before_30",
              "before_14",
              "before_7",
              "before_1",
              "move_day",
              "after",
            ],
          },
        },
        required: ["title", "phase"],
      },
    },
  },
  required: ["items"],
};

export type GeneratedChecklistItem = { title: string; phase: PhaseKey };

function describe(input: MovePlanInput): string {
  const lines = [
    `預計搬家日期：${input.moveDate}`,
    `目前居住情況：${input.housingType}`,
    `是否需要搬家公司：${input.movingCompany}`,
    `大型家具：${input.largeFurniture.join("、") || "（未填）"}`,
    `寵物：${input.pet}`,
    `是否需要申請新家網路：${input.internetSetup}`,
    `是否需要辦理舊家退租：${input.moveOutStatus}`,
    `需要添購的物品：${input.purchaseNeeds.join("、") || "（未填）"}`,
  ];
  if (input.additionalNotes.trim()) {
    lines.push(`其他補充情況：${input.additionalNotes.trim()}`);
  }
  return lines.join("\n");
}

/** 依使用者情況產生客製化搬家 Checklist */
export async function generateMoveChecklist(
  apiKey: string,
  input: MovePlanInput,
): Promise<GeneratedChecklistItem[]> {
  const openai = openAiClient(apiKey);
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const response = await openai.responses.create({
    model,
    instructions: SYSTEM_PROMPT,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `以下是使用者的搬家情況，請產生 Checklist：\n\n${describe(input)}`,
          },
        ],
      },
    ],
    reasoning: { effort: "low" },
    text: {
      format: {
        type: "json_schema",
        name: "move_checklist",
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
        ? "AI 回應太長被截斷，請稍後再試"
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

  const rawItems = (parsed as { items?: unknown })?.items;
  const items: GeneratedChecklistItem[] = Array.isArray(rawItems)
    ? rawItems
        .map((it) => it as Record<string, unknown>)
        .filter(
          (it) =>
            it &&
            typeof it.title === "string" &&
            it.title.trim() !== "" &&
            typeof it.phase === "string" &&
            (PHASE_KEYS as string[]).includes(it.phase),
        )
        .map((it) => ({
          title: String(it.title).trim(),
          phase: it.phase as PhaseKey,
        }))
        .slice(0, 80)
    : [];

  if (items.length === 0) {
    throw new Error("AI 沒有產生任何 Checklist 項目");
  }

  return items;
}
