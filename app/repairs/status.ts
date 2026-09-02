import type { RepairStatus, RepairHandledBy } from "@/app/lib/repairs-types";

export const STATUS_LABEL: Record<RepairStatus, string> = {
  open: "待處理",
  in_progress: "處理中",
  resolved: "已解決",
};

export const STATUS_BADGE: Record<RepairStatus, string> = {
  open: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200",
  in_progress:
    "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-200",
  resolved:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200",
};

export const HANDLED_BY_OPTIONS: { value: RepairHandledBy; label: string }[] = [
  { value: "", label: "（未填）" },
  { value: "self", label: "自己" },
  { value: "landlord", label: "房東" },
  { value: "management", label: "管委會" },
  { value: "plumber", label: "水電師傅" },
  { value: "appliance", label: "家電維修" },
  { value: "other", label: "其他" },
];
