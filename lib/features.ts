export type FeatureSlug =
  | "renting"
  | "repairs"
  | "documents"
  | "bills"
  | "moving"
  | "other";

export type Feature = {
  slug: FeatureSlug;
  emoji: string;
  title: string;
  navLabel: string;
  tagline: string;
};

export const features: Feature[] = [
  {
    slug: "renting",
    emoji: "🏠",
    title: "我要租房 / 看房",
    navLabel: "租房",
    tagline: "貼上租屋或建案資訊，找出被含糊帶過的地方",
  },
  {
    slug: "repairs",
    emoji: "🔧",
    title: "家裡東西壞了",
    navLabel: "維修",
    tagline: "描述狀況，先分辨有沒有危險、該找誰處理",
  },
  {
    slug: "documents",
    emoji: "📄",
    title: "我看不懂這份文件",
    navLabel: "文件",
    tagline: "把合約、規約翻成白話，抓出重要條件",
  },
  {
    slug: "bills",
    emoji: "💸",
    title: "帳單 / 費用有問題",
    navLabel: "帳單",
    tagline: "整理費用項目，找出需要再確認的地方",
  },
  {
    slug: "moving",
    emoji: "📦",
    title: "我要搬家",
    navLabel: "搬家",
    tagline: "依搬家日期，整理各階段的待辦清單",
  },
  {
    slug: "other",
    emoji: "❓",
    title: "其他生活問題",
    navLabel: "其他",
    tagline: "不知道怎麼辦、不知道找誰，先問問看",
  },
];
