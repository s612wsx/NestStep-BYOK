import Link from "next/link";

const capabilities = [
  {
    emoji: "🏠",
    title: "我要租房 / 看房",
    href: "/renting",
    desc: "幫你整理租屋或看房資訊，找出沒有說清楚、值得再確認的地方。",
  },
  {
    emoji: "🔧",
    title: "家裡東西壞了",
    href: "/repairs",
    desc: "遇到漏水、跳電、設備異常等問題時，先幫你做初步分診，整理現在可以先做什麼、該找誰。",
  },
  {
    emoji: "📄",
    title: "我看不懂這份文件",
    href: "/documents",
    desc: "上傳 PDF 或貼文字，幫你把難懂的生活文件翻成白話，整理重要條件與需要確認的地方。",
  },
  {
    emoji: "💸",
    title: "帳單 / 費用有問題",
    href: "/bills",
    desc: "幫你拆解帳單內容、費用組成與可能需要再確認的項目。",
  },
  {
    emoji: "📦",
    title: "我要搬家",
    href: "/moving",
    desc: "根據搬家日期與個人情況，產生客製化搬家 Checklist，並追蹤完成進度。",
  },
  {
    emoji: "❓",
    title: "其他生活問題",
    href: "/other",
    desc: "當你不知道問題屬於哪一類、該找誰或下一步怎麼做時，幫你先整理與分流。",
  },
];

const steps = [
  "遇到問題",
  "描述問題或上傳資料",
  "AI 幫你整理與分析",
  "找到下一步",
];

const roleItems = [
  "幫你把資訊拆開",
  "把難懂的內容翻成白話",
  "找出沒有說清楚的地方",
  "提醒你還可以確認什麼",
  "幫你找到比較合理的下一步",
];

const scenarios = [
  "半夜發現洗手台下面一直漏水，不知道先關哪裡",
  "房仲說「近捷運」，但不知道到底多近",
  "第一次收到電費帳單，看不懂費用怎麼算",
  "租約裡有一大段文字完全看不懂",
  "下個月要搬家，不知道從哪件事開始準備",
];

function StartButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/start"
      className={`inline-flex h-11 items-center justify-center rounded-lg bg-stone-900 px-6 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white ${className}`}
    >
      開始使用 NestStep
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero */}
      <section>
        <h1 className="max-w-xl text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
          第一次自己住，也不用每件事都自己猜。
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-700 dark:text-stone-200">
          不知道怎麼辦時，先從這裡開始。
        </p>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-stone-500 dark:text-stone-400">
          租屋、帳單、故障、文件，遇到不知道怎麼辦的時候，NestStep
          先陪你把問題弄清楚，再一起找到下一步。
        </p>
        <p className="mt-2 max-w-xl text-sm text-stone-500 dark:text-stone-500">
          適合剛搬出來自己住、第一次處理租屋與生活大小事的人。
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
          <StartButton />
          <a
            href="#features"
            className="text-sm text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
          >
            先看看能幫什麼 ↓
          </a>
        </div>
      </section>

      {/* 可以幫你什麼 */}
      <section id="features" className="scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">
          NestStep 可以幫你什麼
        </h2>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          目前有六個方向，遇到哪一種就從哪裡開始。
        </p>
        <div className="mt-6 divide-y divide-stone-200 dark:divide-stone-800">
          {capabilities.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group flex gap-4 py-5 transition-colors hover:bg-stone-100 sm:-mx-2 sm:px-2 dark:hover:bg-stone-900"
            >
              <span aria-hidden className="mt-0.5 text-2xl">
                {c.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-medium">
                  {c.title}
                  <span
                    aria-hidden
                    className="text-stone-400 transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </span>
                <span className="mt-1 block text-[15px] leading-relaxed text-stone-600 dark:text-stone-400">
                  {c.desc}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 怎麼使用 */}
      <section id="how" className="scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">怎麼使用</h2>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          不用懂 AI 或任何技術，四步就好。
        </p>
        <ol className="mt-6 space-y-3">
          {steps.map((step, i) => (
            <li key={step}>
              <div className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-amber-600/10 text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {i + 1}
                </span>
                <span className="text-[15px]">{step}</span>
              </div>
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="ml-3.5 block h-4 border-l border-stone-300 dark:border-stone-700"
                />
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* 我們不替你做決定 */}
      <section
        id="about"
        className="scroll-mt-20 rounded-lg bg-stone-100 p-5 sm:p-6 dark:bg-stone-900"
      >
        <h2 className="text-xl font-semibold tracking-tight">
          我們不替你做決定
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-stone-700 dark:text-stone-300">
          NestStep 不會替你判斷一間房「好不好」、一份文件「該不該簽」，也不會假裝自己能取代房東、水電師傅、律師或其他專業人士。
        </p>
        <p className="mt-4 text-sm font-medium text-stone-500 dark:text-stone-400">
          它的角色是：
        </p>
        <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed">
          {roleItems.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-stone-400">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[15px] leading-relaxed text-stone-700 dark:text-stone-300">
          最後仍由你自己做決定。
        </p>
      </section>

      {/* 第一次自己住 情境 */}
      <section>
        <h2 className="text-xl font-semibold tracking-tight">
          第一次自己住，大概會遇到這些
        </h2>
        <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">
          {scenarios.map((s) => (
            <li key={s} className="flex gap-3">
              <span aria-hidden className="text-stone-400">
                —
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 最後 CTA */}
      <section className="border-t border-stone-200 pt-12 dark:border-stone-800">
        <p className="max-w-xl text-lg font-medium leading-relaxed">
          生活沒有附說明書，但你不用每件事都自己摸索。
        </p>
        <div className="mt-6">
          <StartButton />
        </div>
      </section>
    </div>
  );
}
