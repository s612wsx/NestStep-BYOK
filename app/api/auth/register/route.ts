import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongoose";
import { UserModel } from "@/app/models/User";
import { hashPassword } from "@/app/lib/auth";
import { USERNAME_RE, EMAIL_RE, MIN_PASSWORD_LENGTH } from "@/app/lib/auth-rules";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請以 JSON 格式傳送資料" }, { status: 400 });
  }

  const { username, email, password } = (body ?? {}) as Record<string, unknown>;
  const cleanUsername = typeof username === "string" ? username.trim() : "";
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  const pw = typeof password === "string" ? password : "";

  if (!USERNAME_RE.test(cleanUsername)) {
    return NextResponse.json(
      { error: "使用者 ID 需為 3–20 個字元，只能用英文、數字和底線" },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(normalizedEmail)) {
    return NextResponse.json({ error: "請輸入有效的 email" }, { status: 400 });
  }
  if (pw.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `密碼至少需要 ${MIN_PASSWORD_LENGTH} 個字元` },
      { status: 400 },
    );
  }

  const usernameLower = cleanUsername.toLowerCase();

  try {
    await connectMongo();

    // 檢查 email 或 使用者 ID 是否已被使用
    const clash = await UserModel.findOne({
      $or: [{ email: normalizedEmail }, { usernameLower }],
    })
      .select("email usernameLower")
      .lean();
    if (clash) {
      if (clash.email === normalizedEmail) {
        return NextResponse.json(
          { error: "這個 email 已經註冊過了" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "這個使用者 ID 已經有人使用了" },
        { status: 409 },
      );
    }

    // bcrypt 雜湊後才存進 DB，不存明文
    const passwordHash = await hashPassword(pw);
    const user = await UserModel.create({
      username: cleanUsername,
      usernameLower,
      email: normalizedEmail,
      passwordHash,
    });

    return NextResponse.json(
      {
        user: {
          id: String(user._id),
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    // 唯一索引撞號（極少數並發情況）
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: number }).code === 11000
    ) {
      const key = Object.keys(
        (err as { keyPattern?: Record<string, unknown> }).keyPattern ?? {},
      )[0];
      return NextResponse.json(
        {
          error:
            key === "usernameLower"
              ? "這個使用者 ID 已經有人使用了"
              : "這個 email 已經註冊過了",
        },
        { status: 409 },
      );
    }
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "註冊失敗，請稍後再試" }, { status: 500 });
  }
}
