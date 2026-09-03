import Link from "next/link";

const linkClass =
  "font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900 dark:text-stone-200 dark:hover:text-white";

/**
 * 放在送出按鈕「下方」的小字提示：
 * - 一律顯示成本透明說明。
 * - 還沒登入時（needLogin）：一行連到註冊 / 登入的提示。登入是使用前的第一道門，
 *   這時就先不提金鑰，避免一次丟兩個待辦。
 * - 已登入但還沒設定金鑰時（loaded 且 !hasKey）：一行連到 /settings 的提示。
 *   兩者都完成後這些提示消失、按鈕恢復正常（disabled 狀態由表單自行處理）。
 */
export function ApiKeyNotice({
  hasKey,
  loaded,
  needLogin = false,
}: {
  hasKey: boolean;
  loaded: boolean;
  needLogin?: boolean;
}) {
  return (
    <div className="mt-2 space-y-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
      <p>分析會用你自己的 OpenAI 額度計費。</p>
      {needLogin ? (
        <p>
          這項功能會把結果存進你的帳號 —{" "}
          <Link href="/register" className={linkClass}>
            先註冊
          </Link>{" "}
          或{" "}
          <Link href="/login" className={linkClass}>
            登入
          </Link>{" "}
          才能使用。
        </p>
      ) : (
        loaded &&
        !hasKey && (
          <p>
            還沒設定金鑰 —{" "}
            <Link href="/settings" className={linkClass}>
              到設定貼上你的 OpenAI API 金鑰
            </Link>{" "}
            就能開始。
          </p>
        )
      )}
      {(needLogin || (loaded && !hasKey)) && (
        <p>
          想先看結果長怎樣？{" "}
          <Link href="/demo" className={linkClass}>
            看範例
          </Link>
        </p>
      )}
    </div>
  );
}
