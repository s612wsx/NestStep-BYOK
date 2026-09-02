import { NextResponse } from "next/server";
import { getSessionUser } from "@/app/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    // 未登入回 { user: null }，讓前端能單純判斷登入狀態
    return NextResponse.json({ user });
  } catch (err) {
    console.error("[auth/me]", err);
    return NextResponse.json({ user: null });
  }
}
