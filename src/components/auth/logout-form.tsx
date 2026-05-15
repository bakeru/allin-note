"use client";

import { signOutAction } from "@/actions/auth";
import { PendingSubmitButton } from "@/components/shared/pending-submit-button";

export function LogoutForm({
  className,
}: {
  className?: string;
}) {
  return (
    <form action={signOutAction}>
      <PendingSubmitButton
        variant="ghost"
        size="sm"
        className={className}
        pendingLabel="ログアウト中..."
      >
        ログアウト
      </PendingSubmitButton>
    </form>
  );
}
