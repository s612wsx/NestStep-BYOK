"use client";

import { useEffect, useState } from "react";

export type AuthUser = { id: string; username: string; email: string };

export type AuthUserState = {
  /** 目前登入的使用者；未登入、或還沒確認完成時為 null */
  user: AuthUser | null;
  /** 是否已向伺服器確認過登入狀態（false 前不要拿 user 來擋 UI，避免閃動）*/
  authLoaded: boolean;
};

/**
 * 前端讀取目前登入狀態：元件掛載時打一次 /api/auth/me。
 * 和 useOpenAiKey 一樣，`authLoaded` 為 false 前先別用 `user` 來擋畫面。
 */
export function useAuthUser(): AuthUserState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, authLoaded };
}
