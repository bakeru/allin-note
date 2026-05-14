"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createSchoolFormAction } from "@/actions/schools";
import { initialInlineFormState } from "@/components/shared/action-form-state";
import { FormErrorMessage } from "@/components/shared/form-error-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "作成中..." : "教室を作成"}
    </button>
  );
}

export function CreateSchoolForm() {
  const [state, formAction] = useActionState(
    createSchoolFormAction,
    initialInlineFormState
  );
  const errorMessage = state?.error ?? null;

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">教室名</Label>
        <Input
          id="name"
          name="name"
          required
          className="h-11 rounded-xl border-emerald-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100/70"
          placeholder="教室の特徴や補足があれば入力します。"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subscription_plan">初期プラン</Label>
        <select
          id="subscription_plan"
          name="subscription_plan"
          defaultValue="light"
          className="h-11 w-full rounded-xl border border-emerald-100 bg-white px-4 text-sm outline-none transition focus:border-emerald-300"
          disabled
        >
          {["light", "standard", "plus", "pro", "business", "enterprise"].map(
            (plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            )
          )}
        </select>
        <p className="text-xs text-slate-500">
          今回は初期値の `light` で作成します。課金連携は後続タスクで追加します。
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4 text-sm text-slate-700">
        <input
          type="checkbox"
          name="also_be_a_teacher"
          defaultChecked
          className="mt-0.5 size-4 rounded border-emerald-300"
        />
        <span>自分自身をこの教室の講師としても登録する</span>
      </label>

      <FormErrorMessage message={errorMessage} />

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
