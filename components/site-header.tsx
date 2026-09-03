"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { features } from "@/lib/features";
import { ThemeToggle } from "@/components/theme-toggle";

type AuthUser = { id: string; username: string; email: string };

const LANDING_NAV = [
  { href: "/#features", label: "功能介紹" },
  { href: "/#how", label: "怎麼使用" },
  { href: "/#about", label: "關於 NestStep" },
];

const navLinkClass =
  "rounded-md px-2.5 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-200/70 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white";
const primaryClass =
  "inline-flex items-center rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white";
const mobileItemClass =
  "flex items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-900";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const isLanding = pathname === "/";

  // 每次換頁都重新確認登入狀態，登入 / 登出後 Header 會即時更新
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
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/start" ? pathname === "/start" : pathname.startsWith(href);

  const close = () => setOpen(false);

  const onDemo = pathname.startsWith("/demo");

  // 範例入口：用 amber 底色的小膠囊，在一片灰階導覽裡一眼就看得到，
  // 但形狀 / 字級都跟其他項目一致，不破壞整體。
  const demoChip = (
    <Link
      href="/demo"
      aria-label="看功能範例"
      aria-current={onDemo ? "page" : undefined}
      className={`inline-flex shrink-0 items-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
        onDemo
          ? "bg-amber-600 text-white"
          : "bg-amber-600/10 text-amber-700 hover:bg-amber-600/20 dark:text-amber-400 dark:hover:bg-amber-600/25"
      }`}
    >
      範例
    </Link>
  );

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setOpen(false);
      router.push("/");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/85 backdrop-blur dark:border-stone-800 dark:bg-stone-950/85">
      <div className="mx-auto w-full max-w-3xl px-5">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link
            href="/"
            onClick={close}
            aria-label="回到 NestStep 首頁"
            className="group flex shrink-0 items-center gap-2.5 leading-none"
          >
            {/* 小鳥巢：單線織紋 + 溫和的褐色蛋，呼應「Nest」。overflow-visible
                讓蛋在 hover 浮起時不會被裁掉。 */}
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="none"
              aria-hidden="true"
              className="shrink-0 overflow-visible text-stone-800 dark:text-stone-200"
            >
              <path
                d="M4 10.6 7 9.5M20 10.6 17 9.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                opacity="0.5"
              />
              <ellipse
                cx="12"
                cy="10.6"
                rx="2.7"
                ry="3.1"
                fill="#bd8b60"
                stroke="currentColor"
                strokeWidth="0.9"
                strokeOpacity="0.35"
                className="transition-transform duration-200 group-hover:-translate-y-1"
              />
              <path
                d="M3.6 11c0 5.4 3.9 8.5 8.4 8.5S20.4 16.4 20.4 11"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <path
                d="M6.1 12c.5 3.7 3 5.6 5.9 5.6S17.4 15.7 17.9 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M8.4 12.6c.5 2.1 2 3.2 3.6 3.2s3.1-1.1 3.6-3.2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.4"
              />
            </svg>
            <span className="block">
              <span className="block text-lg font-semibold tracking-tight">
                NestStep
              </span>
              <span className="mt-0.5 block text-[11px] font-medium text-stone-500 dark:text-stone-400">
                離家使用說明書
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isLanding ? (
              <>
                <nav className="hidden items-center gap-0.5 md:flex">
                  {LANDING_NAV.map((n) => (
                    <Link key={n.href} href={n.href} className={navLinkClass}>
                      {n.label}
                    </Link>
                  ))}
                </nav>
                {demoChip}
                <Link href="/start" className={primaryClass}>
                  開始使用
                </Link>
                {authLoaded && user && (
                  <div className="hidden items-center gap-2 border-l border-stone-200 pl-3 md:flex dark:border-stone-800">
                    <span className="text-sm font-medium">@{user.username}</span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={navLinkClass}
                    >
                      登出
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <nav className="hidden items-center gap-0.5 md:flex">
                  {features.map((f) => (
                    <Link
                      key={f.slug}
                      href={`/${f.slug}`}
                      aria-current={isActive(`/${f.slug}`) ? "page" : undefined}
                      className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                        isActive(`/${f.slug}`)
                          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                          : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
                      }`}
                    >
                      {f.navLabel}
                    </Link>
                  ))}
                </nav>

                <Link
                  href="/settings"
                  aria-current={isActive("/settings") ? "page" : undefined}
                  className={`hidden md:inline-block ${navLinkClass}`}
                >
                  設定
                </Link>

                <span className="hidden md:inline-flex">{demoChip}</span>

                {authLoaded && (
                  <div className="hidden items-center gap-2 border-l border-stone-200 pl-3 md:flex dark:border-stone-800">
                    {user ? (
                      <>
                        <span className="text-sm font-medium">
                          @{user.username}
                        </span>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className={navLinkClass}
                        >
                          登出
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className={navLinkClass}>
                          登入
                        </Link>
                        <Link href="/register" className={primaryClass}>
                          註冊
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            <ThemeToggle />

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="site-menu"
              className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 px-2.5 py-1.5 text-sm md:hidden dark:border-stone-700"
            >
              <span aria-hidden>{open ? "✕" : "☰"}</span>
              選單
            </button>
          </div>
        </div>

        {open && (
          <nav
            id="site-menu"
            className="border-t border-stone-200 py-2 md:hidden dark:border-stone-800"
          >
            {isLanding ? (
              <>
                <Link
                  href="/start"
                  onClick={close}
                  className={`${mobileItemClass} bg-stone-200/70 font-medium dark:bg-stone-800`}
                >
                  <span aria-hidden className="text-base">
                    🧭
                  </span>
                  開始使用 NestStep
                </Link>
                <Link
                  href="/demo"
                  onClick={close}
                  aria-current={onDemo ? "page" : undefined}
                  className={`${mobileItemClass} font-medium text-amber-700 dark:text-amber-400 ${
                    onDemo ? "bg-amber-600/10" : ""
                  }`}
                >
                  <span aria-hidden className="text-base">
                    🔍
                  </span>
                  看功能範例
                </Link>
                {LANDING_NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={close}
                    className={mobileItemClass}
                  >
                    {n.label}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <Link
                  href="/start"
                  onClick={close}
                  aria-current={isActive("/start") ? "page" : undefined}
                  className={`${mobileItemClass} ${
                    isActive("/start")
                      ? "bg-stone-200/70 font-medium dark:bg-stone-800"
                      : ""
                  }`}
                >
                  <span aria-hidden className="text-base">
                    🧭
                  </span>
                  功能首頁
                </Link>
                <Link
                  href="/demo"
                  onClick={close}
                  aria-current={onDemo ? "page" : undefined}
                  className={`${mobileItemClass} font-medium text-amber-700 dark:text-amber-400 ${
                    onDemo ? "bg-amber-600/10" : ""
                  }`}
                >
                  <span aria-hidden className="text-base">
                    🔍
                  </span>
                  看功能範例
                </Link>
                {features.map((f) => (
                  <Link
                    key={f.slug}
                    href={`/${f.slug}`}
                    onClick={close}
                    aria-current={isActive(`/${f.slug}`) ? "page" : undefined}
                    className={`${mobileItemClass} ${
                      isActive(`/${f.slug}`)
                        ? "bg-stone-200/70 font-medium dark:bg-stone-800"
                        : ""
                    }`}
                  >
                    <span aria-hidden className="text-base">
                      {f.emoji}
                    </span>
                    {f.title}
                  </Link>
                ))}
                <Link
                  href="/settings"
                  onClick={close}
                  aria-current={isActive("/settings") ? "page" : undefined}
                  className={`${mobileItemClass} ${
                    isActive("/settings")
                      ? "bg-stone-200/70 font-medium dark:bg-stone-800"
                      : ""
                  }`}
                >
                  <span aria-hidden className="text-base">
                    ⚙️
                  </span>
                  設定
                </Link>
              </>
            )}

            {authLoaded && (
              <div className="mt-1 border-t border-stone-200 pt-1 dark:border-stone-800">
                {user ? (
                  <>
                    <div className="px-2 py-2.5 text-sm text-stone-500">
                      已登入為{" "}
                      <span className="font-medium text-stone-700 dark:text-stone-300">
                        @{user.username}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`${mobileItemClass} w-full text-left`}
                    >
                      <span aria-hidden className="text-base">
                        🚪
                      </span>
                      登出
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={close}
                      className={mobileItemClass}
                    >
                      <span aria-hidden className="text-base">
                        🔑
                      </span>
                      登入
                    </Link>
                    <Link
                      href="/register"
                      onClick={close}
                      className={mobileItemClass}
                    >
                      <span aria-hidden className="text-base">
                        ✏️
                      </span>
                      註冊
                    </Link>
                  </>
                )}
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
