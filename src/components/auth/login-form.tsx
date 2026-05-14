"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signInAction } from "@/actions/auth";
import { initialAuthActionState } from "@/components/auth/auth-action-state";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonVariants({
        className:
          "h-11 w-full rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 hover:text-white disabled:hover:bg-emerald-500 disabled:hover:text-white",
      })}
    >
      {pending ? "ログイン中..." : "ログイン"}
    </button>
  );
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(signInAction, initialAuthActionState);
  const errorMessage = state?.error ?? null;

  return (
    <form action={formAction} className="space-y-5">
      {redirectTo ? <input type="hidden" name="redirect_to" value={redirectTo} /> : null}
      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          className="h-11 rounded-xl border-emerald-100"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">パスワード</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          className="h-11 rounded-xl border-emerald-100"
        />
      </div>
      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}
      <SubmitButton />
    </form>
  );
}
