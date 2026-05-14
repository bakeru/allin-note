"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { TeacherBottomNav } from "@/components/teacher/teacher-bottom-nav";
import { TeacherRecordLauncherSheet } from "@/components/teacher/teacher-record-launcher-sheet";

type TeacherMobileShellProps = {
  children: React.ReactNode;
  todayReservationCount: number;
};

export function TeacherMobileShell({
  children,
  todayReservationCount,
}: TeacherMobileShellProps) {
  const pathname = usePathname();
  const [isRecordSheetOpen, setIsRecordSheetOpen] = useState(false);

  useEffect(() => {
    setIsRecordSheetOpen(false);
  }, [pathname]);

  const activeKey = useMemo(() => {
    if (pathname === "/dashboard") {
      return "home" as const;
    }

    if (pathname.startsWith("/reservations")) {
      return "lessons" as const;
    }

    if (pathname.startsWith("/karte")) {
      return "karte" as const;
    }

    if (pathname.startsWith("/mypage")) {
      return "mypage" as const;
    }

    return null;
  }, [pathname]);

  const hideBottomNav =
    pathname.startsWith("/record/start/") ||
    pathname.startsWith("/record/student/") ||
    pathname.startsWith("/lessons/");

  return (
    <>
      <main className="pb-[calc(env(safe-area-inset-bottom)+92px)] md:pb-0">
        {children}
      </main>
      {!hideBottomNav ? (
        <>
          <TeacherBottomNav
            activeKey={activeKey}
            onTapRecord={() => setIsRecordSheetOpen(true)}
          />
          <TeacherRecordLauncherSheet
            open={isRecordSheetOpen}
            todayReservationCount={todayReservationCount}
            onClose={() => setIsRecordSheetOpen(false)}
          />
        </>
      ) : null}
    </>
  );
}
