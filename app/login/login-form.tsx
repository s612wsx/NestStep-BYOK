"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:focus:ring-stone-800";

type Status = "idle" | "loading" | "error";

export function LoginForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const identifier = String(data.get("identifier") ?? "").trim();
    const password = String(data.get("password") ?? "");

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || `伺服器回應 ${res.status}`);
      }
      // 登入成功導到功能首頁；Header 會在換頁時重新確認登入狀態
      router.push("/start");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "登入失敗，請稍後再試");
      setStatus("error");
    }
  };

  const loading = status === "loading";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {errorMsg}
        </p>
      )}

      <div>
        <label htmlFor="login-identifier" className="text-sm font-medium">
          Email 或 使用者 ID
        </label>
        <input
          id="login-identifier"
          name="identifier"
          type="text"
          required
          autoComplete="username"
          placeholder="you@example.com 或 ming_2026"
          className={`mt-2 ${inputClass}`}
        />
      </div>

      <div>
        <label htmlFor="login-password" className="text-sm font-medium">
          密碼
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={`mt-2 ${inputClass}`}
        />
      </div>

      <div className="pt-1">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-stone-900 px-5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
        >
          {loading ? "登入中…" : "登入"}
        </button>
      </div>

      <p className="text-sm text-stone-500">
        還沒有帳號？{" "}
        <Link
          href="/register"
          className="text-stone-900 underline underline-offset-2 dark:text-stone-100"
        >
          註冊
        </Link>
      </p>
    </form>
  );
}
