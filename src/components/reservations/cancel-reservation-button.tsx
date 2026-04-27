"use client";

import { useMemo, useState, useTransition } from "react";

import { cancelReservationAction } from "@/actions/reservations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CancelReservationButtonProps = {
  reservationId: string;
  scheduledAt: string;
  deadlineHours: number;
  lateCancellationPolicy: "consume" | "no_cancel";
  triggerLabel?: string;
  variant?: "ghost" | "outline";
};

export function CancelReservationButton({
  reservationId,
  scheduledAt,
  deadlineHours,
  lateCancellationPolicy,
  triggerLabel = "キャンセル",
  variant = "outline",
}: CancelReservationButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { canCancel, message } = useMemo(() => {
    const start = new Date(scheduledAt);
    const now = new Date();
    const hoursUntil =
      (start.getTime() - now.getTime()) / (60 * 60 * 1000);

    if (hoursUntil >= deadlineHours) {
      return {
        canCancel: true,
        message: "キャンセル期限内です。無料でキャンセルできます。",
      };
    }

    if (lateCancellationPolicy === "no_cancel") {
      return {
        canCancel: false,
        message: `キャンセル期限(${deadlineHours}時間前)を過ぎています。教室に直接ご連絡ください。`,
      };
    }

    return {
      canCancel: true,
      message: "キャンセル期限後のため、レッスン1回消化として記録されます。",
    };
  }, [deadlineHours, lateCancellationPolicy, scheduledAt]);

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      try {
        await cancelReservationAction(reservationId);
        setOpen(false);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "キャンセルに失敗しました。"
        );
      }
    });
  };

  return (
    <>
      <Button type="button" variant={variant} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={!isPending}>
          <DialogHeader>
            <DialogTitle>予約をキャンセルしますか？</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              閉じる
            </Button>
            {canCancel ? (
              <Button type="button" onClick={onConfirm} disabled={isPending}>
                {isPending ? "処理中..." : "キャンセルする"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
