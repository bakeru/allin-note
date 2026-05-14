"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signUpAction } from "@/actions/auth";
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
      {pending ? "登録中..." : "登録する"}
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(signUpAction, initialAuthActionState);
  const errorMessage = state?.error ?? null;

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="display_name">お名前</Label>
        <Input
          id="display_name"
          name="display_name"
          required
          className="h-11 rounded-xl border-emerald-100"
        />
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-slate-900">ロール</legend>
        <label className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
          <input type="radio" name="role" value="school_owner" defaultChecked />
          <div>
            <p className="font-medium text-slate-950">教室オーナー</p>
            <p className="text-sm text-slate-600">教室を運営する方向けです。</p>
          </div>
        </label>
        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 opacity-70">
          <input type="radio" name="role" value="teacher" />
          <div>
            <p className="font-medium text-slate-950">講師</p>
            <p className="text-sm text-slate-600">招待リンクから登録します。</p>
          </div>
        </label>
        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 opacity-70">
          <input type="radio" name="role" value="student" />
          <div>
            <p className="font-medium text-slate-950">生徒・保護者</p>
            <p className="text-sm text-slate-600">招待リンクから登録します。</p>
          </div>
        </label>
      </fieldset>
      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}
      <SubmitButton />
    </form>
  );
}
