"use client";

import Link from "next/link";
import {
  CalendarDays,
  FileText,
  Home,
  Mic,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ActiveKey = "home" | "lessons" | "karte" | "mypage" | null;

type TeacherBottomNavProps = {
  activeKey: ActiveKey;
  onTapRecord: () => void;
};

const NAV_ITEMS = [
  { key: "home", label: "ホーム", icon: Home, href: "/dashboard" },
  {
    key: "lessons",
    label: "レッスン",
    icon: CalendarDays,
    href: "/reservations",
  },
  { key: "karte", label: "カルテ", icon: FileText, href: "/karte" },
  { key: "mypage", label: "マイページ", icon: User, href: "/mypage" },
] as const;

export function TeacherBottomNav({
  activeKey,
  onTapRecord,
}: TeacherBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_1fr_76px_1fr_1fr] items-end border-t border-slate-200 bg-white px-1 pt-2 pb-[calc(env(safe-area-inset-bottom)+18px)] shadow-[0_-10px_24px_rgba(15,23,42,0.06)] md:hidden">
      {NAV_ITEMS.slice(0, 2).map((item) => (
        <BottomNavLink
          key={item.key}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={activeKey === item.key}
        />
      ))}

      <button
        type="button"
        onClick={onTapRecord}
        className="flex flex-col items-center gap-1 border-0 bg-transparent"
      >
        <span className="flex h-14 w-14 -translate-y-[22px] items-center justify-center rounded-full border-[3px] border-white bg-[#1D9E75] shadow-[0_8px_20px_rgba(15,110,86,0.25)]">
          <Mic className="h-7 w-7 text-white" />
        </span>
        <span className="-mt-4 text-[9px] font-medium text-[#1D9E75]">
          録音
        </span>
      </button>

      {NAV_ITEMS.slice(2).map((item) => (
        <BottomNavLink
          key={item.key}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={activeKey === item.key}
        />
      ))}
    </nav>
  );
}

function BottomNavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 px-2 py-1"
    >
      <Icon
        className={cn(
          "h-[22px] w-[22px] transition-colors",
          active ? "text-[#1D9E75]" : "text-[#888780]"
        )}
      />
      <span
        className={cn(
          "text-[9px] font-medium transition-colors",
          active ? "text-[#1D9E75]" : "text-[#888780]"
        )}
      >
        {label}
      </span>
    </Link>
  );
}
