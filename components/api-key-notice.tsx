import Link from "next/link";

/**
 * 放在送出按鈕「下方」的小字提示：
 * - 一律顯示成本透明說明。
 * - 還沒設定金鑰時（loaded 且 !hasKey），多一行連到 /settings 的提示。
 *   設定好之後這行就消失、按鈕恢復正常（由表單自行處理 disabled 狀態）。
 */
export function ApiKeyNotice({
  hasKey,
  loaded,
}: {
  hasKey: boolean;
  loaded: boolean;
}) {
  return (
    <div className="mt-2 space-y-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
      <p>分析會用你自己的 OpenAI 額度計費。</p>
      {loaded && !hasKey && (
        <p>
          還沒設定金鑰 —{" "}
          <Link
            href="/settings"
            className="font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900 dark:text-stone-200 dark:hover:text-white"
          >
            到設定貼上你的 OpenAI API 金鑰
          </Link>{" "}
          就能開始。
        </p>
      )}
    </div>
  );
}
