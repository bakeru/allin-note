"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createAreaAction, updateAreaAction } from "@/actions/locations";
import { initialInlineFormState } from "@/components/shared/action-form-state";
import { FormErrorMessage } from "@/components/shared/form-error-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function AreaForm({
  schoolId,
  areaId,
  defaultName = "",
}: {
  schoolId: string;
  areaId?: string;
  defaultName?: string;
}) {
  const action = areaId ? updateAreaAction : createAreaAction;
  const [state, formAction] = useActionState(action, initialInlineFormState);
  const errorMessage = state?.error ?? null;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="school_id" value={schoolId} />
      {areaId ? <input type="hidden" name="area_id" value={areaId} /> : null}
      <div className="space-y-2">
        <Label htmlFor="name">エリア名</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultName}
          placeholder="新宿エリア"
          className="h-11 rounded-xl border-emerald-100"
        />
      </div>
      <FormErrorMessage message={errorMessage} />
      <div className="flex justify-end">
        <SubmitButton
          label={areaId ? "更新する" : "追加する"}
          pendingLabel={areaId ? "更新中..." : "追加中..."}
        />
      </div>
    </form>
  );
}
