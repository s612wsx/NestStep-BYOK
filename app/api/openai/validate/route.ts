import { NextResponse } from "next/server";
import { OPENAI_KEY_HEADER } from "@/app/lib/openai-client";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * 驗證使用者貼上的 OpenAI API 金鑰是否有效。
 * 只拿金鑰打一次 OpenAI GET /v1/models，成功就回 { valid: true }。
 * NestStep 不儲存、不記錄這把金鑰——它只在這個請求中被轉給 OpenAI。
 */
export async function POST(request: Request) {
  const key = request.headers.get(OPENAI_KEY_HEADER)?.trim() ?? "";
  if (!key) {
    return NextResponse.json(
      { valid: false, error: "請先貼上金鑰" },
      { status: 400 },
    );
  }

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { valid: false, error: "無法連線到 OpenAI，請稍後再試" },
      { status: 502 },
    );
  }

  if (res.ok) {
    return NextResponse.json({ valid: true });
  }
  if (res.status === 401) {
    return NextResponse.json({
      valid: false,
      error: "金鑰無效或已被停用",
    });
  }
  if (res.status === 429) {
    return NextResponse.json({
      valid: false,
      error: "金鑰有效，但目前額度不足或被限流（429）",
    });
  }
  return NextResponse.json({
    valid: false,
    error: `OpenAI 回應 ${res.status}，請確認金鑰是否正確`,
  });
}
