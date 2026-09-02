import OpenAI from "openai";

/** 使用者用來夾帶自己 OpenAI API 金鑰的 request header */
export const OPENAI_KEY_HEADER = "x-openai-key";

/** 沒有帶金鑰時丟出，API 會回 400（BYOK：金鑰由使用者提供）*/
export class MissingApiKeyError extends Error {
  constructor() {
    super("尚未設定 OpenAI API 金鑰");
    this.name = "MissingApiKeyError";
  }
}

/**
 * 從 request header 取出使用者的 OpenAI API 金鑰。
 * NestStep 不儲存、不記錄這把金鑰，只在這次請求中轉給 OpenAI。
 */
export function apiKeyFromRequest(request: Request): string {
  const key = request.headers.get(OPENAI_KEY_HEADER)?.trim() ?? "";
  if (!key) throw new MissingApiKeyError();
  return key;
}

/** 用指定金鑰建立 OpenAI client（每次請求現建，不做 singleton）*/
export function openAiClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}
