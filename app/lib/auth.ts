import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectMongo } from "@/app/lib/mongoose";
import { UserModel } from "@/app/models/User";

const BCRYPT_ROUNDS = 12;
// JWT / Cookie 有效期限：7 天
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export const AUTH_COOKIE = "neststep_token";

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
};

type AuthTokenPayload = {
  sub: string;
  username: string;
  email: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("環境變數缺少 JWT_SECRET");
  }
  return secret;
}

// ── 密碼雜湊 ──────────────────────────────────────────────────

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── JWT ──────────────────────────────────────────────────────

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === "string") return null;
    const sub = decoded.sub;
    const username = decoded.username;
    const email = decoded.email;
    if (
      typeof sub === "string" &&
      typeof username === "string" &&
      typeof email === "string"
    ) {
      return { sub, username, email };
    }
    return null;
  } catch {
    return null;
  }
}

// ── 登入 Cookie（HTTP-only）─────────────────────────────────────

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

/** 從 HTTP-only Cookie 取出目前登入的使用者；未登入或 token 無效回傳 null */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload) return null;

  await connectMongo();
  const user = await UserModel.findById(payload.sub).lean();
  if (!user) return null;

  return {
    id: String(user._id),
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}
