import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Variant = "active" | "completed";

type ReservationCardProps = {
  reservation: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    student_name: string;
  };
  variant: Variant;
};

const formatTime = (value: Date) =>
  new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

export function ReservationCard({
  reservation,
  variant,
}: ReservationCardProps) {
  const startTime = new Date(reservation.scheduled_at);
  const endTime = new Date(
    startTime.getTime() + reservation.duration_minutes * 60 * 1000
  );

  return (
    <Card
      className={cn(
        "rounded-lg border-0 ring-1 ring-neutral-200",
        variant === "completed" ? "bg-neutral-50" : "bg-white"
      )}
    >
      <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-950">
            {reservation.student_name}さん
          </h3>
          <p className="mt-1 text-sm text-neutral-600">
            {formatTime(startTime)} 〜 {formatTime(endTime)}
          </p>
        </div>

        {variant === "active" ? (
          <Link href={`/record/start/${reservation.id}`}>
            <Button size="lg">このレッスンを録音開始</Button>
          </Link>
        ) : (
          <span className="text-sm text-neutral-500">録音済み</span>
        )}
      </CardContent>
    </Card>
  );
}
