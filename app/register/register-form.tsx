"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  USERNAME_RE,
  EMAIL_RE,
  MIN_PASSWORD_LENGTH,
  USERNAME_HINT,
} from "@/app/lib/auth-rules";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:focus:ring-stone-800";

type Status = "idle" | "loading" | "done" | "error";
type UsernameStatus =
  | "idle"
  | "invalid"
  | "checking"
  | "available"
  | "taken"
  | "error";

export function RegisterForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [username, setUsername] = useState("");
  // 最近一次「完成」的遠端檢查結果與錯誤，都用當時的字串標記，避免過期覆蓋
  const [checked, setChecked] = useState<{ name: string; available: boolean } | null>(
    null,
  );
  const [checkErrorFor, setCheckErrorFor] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const trimmedUsername = username.trim();
  const usernameFormatOk =
    trimmedUsername === "" ? null : USERNAME_RE.test(trimmedUsername);

  // 使用者 ID 即時檢查：防抖 + 取消過期請求。state 只在非同步 callback 內更新。
  useEffect(() => {
    if (usernameFormatOk !== true) return;
    const name = trimmedUsername;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(name)}`,
          { signal: controller.signal },
        );
        const json = await res.json();
        if (!res.ok) {
          setCheckErrorFor(name);
          return;
        }
        setChecked({ name, available: Boolean(json.available) });
        setCheckErrorFor(null);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setCheckErrorFor(name);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedUsername, usernameFormatOk]);

  // 顯示用狀態，在 render 時推導出來
  let usernameStatus: UsernameStatus = "idle";
  if (trimmedUsername === "") usernameStatus = "idle";
  else if (usernameFormatOk === false) usernameStatus = "invalid";
  else if (checkErrorFor === trimmedUsername) usernameStatus = "error";
  else if (checked?.name === trimmedUsername)
    usernameStatus = checked.available ? "available" : "taken";
  else usernameStatus = "checking";

  const onEmailChange = (value: string) => {
    setEmail(value);
    const trimmed = value.trim();
    setEmailError(
      trimmed === "" || EMAIL_RE.test(trimmed) ? "" : "email 格式看起來不太對",
    );
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    if (!EMAIL_RE.test(email.trim())) {
      setEmailError("email 格式看起來不太對");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMsg("兩次輸入的密碼不一致");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmedUsername,
          email: email.trim(),
          password,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        // 送出當下若使用者 ID 剛好被搶走，回饋到欄位
        if (res.status === 409 && /使用者 ID/.test(json?.error ?? "")) {
          setChecked({ name: trimmedUsername, available: false });
        }
        throw new Error(json?.error || `伺服器回應 ${res.status}`);
      }
      setStatus("done");
      setTimeout(() => router.push("/login"), 1000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "註冊失敗，請稍後再試");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="space-y-3">
        <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          <span aria-hidden>✓</span> 註冊成功，正在帶你前往登入…
        </p>
        <Link
          href="/login"
          className="text-sm text-stone-900 underline underline-offset-2 dark:text-stone-100"
        >
          現在登入
        </Link>
      </div>
    );
  }

  const loading = status === "loading";
  const usernameBlocks =
    usernameStatus === "invalid" ||
    usernameStatus === "taken" ||
    usernameStatus === "checking";
  const submitDisabled = loading || usernameBlocks || emailError !== "";

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {errorMsg}
        </p>
      )}

      <div>
        <label htmlFor="reg-username" className="text-sm font-medium">
          使用者 ID
        </label>
        <p className="mt-1 text-xs text-stone-500">
          {USERNAME_HINT}；登入和顯示都會用到，且不能和別人重複。
        </p>
        <input
          id="reg-username"
          name="username"
          type="text"
          required
          minLength={3}
          maxLength={20}
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="例如：ming_2026"
          aria-invalid={usernameStatus === "invalid" || usernameStatus === "taken"}
          className={`mt-2 ${inputClass}`}
        />
        <UsernameHint status={usernameStatus} />
      </div>

      <div>
        <label htmlFor="reg-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          onBlur={(event) => onEmailChange(event.target.value)}
          placeholder="you@example.com"
          aria-invalid={emailError !== ""}
          className={`mt-2 ${inputClass}`}
        />
        {emailError && (
          <p className="mt-1 text-xs text-red-700 dark:text-red-300">
            {emailError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="reg-password" className="text-sm font-medium">
          密碼
        </label>
        <p className="mt-1 text-xs text-stone-500">
          至少 {MIN_PASSWORD_LENGTH} 個字元。
        </p>
        <input
          id="reg-password"
          name="password"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={`mt-2 ${inputClass}`}
        />
      </div>

      <div>
        <label htmlFor="reg-confirm" className="text-sm font-medium">
          確認密碼
        </label>
        <input
          id="reg-confirm"
          name="confirmPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={`mt-2 ${inputClass}`}
        />
      </div>

      <div className="pt-1">
        <button
          type="submit"
          disabled={submitDisabled}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-stone-900 px-5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
        >
          {loading ? "註冊中…" : "建立帳號"}
        </button>
      </div>

      <p className="text-sm text-stone-500">
        已經有帳號了？{" "}
        <Link
          href="/login"
          className="text-stone-900 underline underline-offset-2 dark:text-stone-100"
        >
          登入
        </Link>
      </p>
    </form>
  );
}

function UsernameHint({ status }: { status: UsernameStatus }) {
  if (status === "checking") {
    return <p className="mt-1 text-xs text-stone-500">檢查中…</p>;
  }
  if (status === "invalid") {
    return (
      <p className="mt-1 text-xs text-red-700 dark:text-red-300">
        使用者 ID 格式不符（{USERNAME_HINT}）
      </p>
    );
  }
  if (status === "taken") {
    return (
      <p className="mt-1 text-xs text-red-700 dark:text-red-300">
        這個使用者 ID 已經有人使用了
      </p>
    );
  }
  if (status === "available") {
    return (
      <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
        <span aria-hidden>✓</span> 可以使用
      </p>
    );
  }
  if (status === "error") {
    return (
      <p className="mt-1 text-xs text-stone-500">
        目前無法即時檢查，送出時會再確認一次。
      </p>
    );
  }
  return null;
}
