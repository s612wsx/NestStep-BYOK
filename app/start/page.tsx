import type { Metadata } from "next";
import Link from "next/link";
import { features } from "@/lib/features";

export const metadata: Metadata = { title: "今天卡在哪裡？" };

export default function StartPage() {
  return (
    <div>
      <p className="max-w-xl text-base leading-relaxed text-stone-700 dark:text-stone-200">
        第一次自己住，很多事情都得第一次學。
      </p>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-stone-500 dark:text-stone-400">
        租屋、帳單、故障、文件，遇到不知道怎麼辦的時候，NestStep
        先陪你把問題弄清楚，再一起找到下一步。
      </p>

      <h1 className="mt-10 text-2xl font-semibold tracking-tight sm:text-3xl">
        今天卡在哪裡？
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-500 dark:text-stone-400">
        選一個最接近的狀況。
      </p>

      <ul className="mt-8 border-t border-stone-200 dark:border-stone-800">
        {features.map((feature) => (
          <li
            key={feature.slug}
            className="border-b border-stone-200 dark:border-stone-800"
          >
            <Link
              href={`/${feature.slug}`}
              className="group flex items-center gap-4 px-1 py-4 transition-colors hover:bg-stone-100 dark:hover:bg-stone-900"
            >
              <span aria-hidden className="text-2xl">
                {feature.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{feature.title}</span>
                <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400">
                  {feature.tagline}
                </span>
              </span>
              <span
                aria-hidden
                className="shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
