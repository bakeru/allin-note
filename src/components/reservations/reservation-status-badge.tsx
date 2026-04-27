import { cn } from "@/lib/utils";

const STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  scheduled: {
    label: "予定",
    className: "bg-sky-100 text-sky-800",
  },
  completed: {
    label: "完了",
    className: "bg-emerald-100 text-emerald-800",
  },
  cancelled: {
    label: "通常キャンセル",
    className: "bg-neutral-200 text-neutral-700",
  },
  cancelled_late: {
    label: "当日消化",
    className: "bg-amber-100 text-amber-800",
  },
  cancelled_by_teacher: {
    label: "講師都合",
    className: "bg-cyan-100 text-cyan-800",
  },
};

export function ReservationStatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const meta = STATUS_META[status ?? ""] ?? {
    label: status ?? "不明",
    className: "bg-neutral-200 text-neutral-700",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}
