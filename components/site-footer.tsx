export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200 dark:border-stone-800">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 text-xs leading-relaxed text-stone-500">
        <p className="font-medium text-stone-600 dark:text-stone-400">
          NestStep · 離家使用說明書
        </p>
        <p className="mt-1">不知道怎麼辦時，先從這裡開始。</p>

        <p className="mt-5 max-w-md text-stone-400 dark:text-stone-500">
          分析使用你自己的 OpenAI API 金鑰，金鑰只留在這台裝置，NestStep
          不會儲存。內容為資訊整理，不構成法律、財務或其他專業建議。
        </p>

        <p className="mt-4 text-amber-800/70 dark:text-amber-500/70">
          © {year} NestStep
        </p>
      </div>
    </footer>
  );
}
