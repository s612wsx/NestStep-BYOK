import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongoose";
import { UserModel } from "@/app/models/User";
import { verifyPassword, signAuthToken, setAuthCookie } from "@/app/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請以 JSON 格式傳送資料" }, { status: 400 });
  }

  const { identifier, password } = (body ?? {}) as Record<string, unknown>;
  const id = typeof identifier === "string" ? identifier.trim() : "";
  const pw = typeof password === "string" ? password : "";

  if (!id || !pw) {
    return NextResponse.json(
      { error: "請輸入 email 或使用者 ID，以及密碼" },
      { status: 400 },
    );
  }

  try {
    await connectMongo();

    // email 或 使用者 ID 都能登入（皆不分大小寫）
    const lower = id.toLowerCase();
    const user = await UserModel.findOne({
      $or: [{ email: lower }, { usernameLower: lower }],
    }).lean();

    // 帳號不存在或密碼錯誤都回同樣訊息
    const passwordOk = user
      ? await verifyPassword(pw, user.passwordHash)
      : false;
    if (!user || !passwordOk) {
      return NextResponse.json(
        { error: "帳號或密碼錯誤" },
        { status: 401 },
      );
    }

    // 登入成功 → 簽 JWT，寫進 HTTP-only Cookie
    const token = signAuthToken({
      sub: String(user._id),
      username: user.username,
      email: user.email,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: String(user._id),
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "登入失敗，請稍後再試" }, { status: 500 });
  }
}
