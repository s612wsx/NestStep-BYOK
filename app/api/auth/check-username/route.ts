import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongoose";
import { UserModel } from "@/app/models/User";
import { USERNAME_RE } from "@/app/lib/auth-rules";

export const runtime = "nodejs";

/** 註冊表單即時檢查使用者 ID 是否可用 */
export async function GET(request: Request) {
  const username =
    new URL(request.url).searchParams.get("username")?.trim() ?? "";

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  try {
    await connectMongo();
    const existing = await UserModel.findOne({
      usernameLower: username.toLowerCase(),
    })
      .select("_id")
      .lean();
    return NextResponse.json({ available: !existing });
  } catch (err) {
    console.error("[auth/check-username]", err);
    return NextResponse.json({ error: "無法檢查" }, { status: 500 });
  }
}
