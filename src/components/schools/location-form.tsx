"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createLocationAction, updateLocationAction } from "@/actions/locations";
import { initialInlineFormState } from "@/components/shared/action-form-state";
import { FormErrorMessage } from "@/components/shared/form-error-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AreaOption = {
  id: string;
  name: string;
};

type LocationDefaults = {
  name?: string;
  type?: string;
  areaId?: string | null;
  notes?: string | null;
};

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

export function LocationForm({
  schoolId,
  locationId,
  areas,
  defaults,
}: {
  schoolId: string;
  locationId?: string;
  areas: AreaOption[];
  defaults?: LocationDefaults;
}) {
  const action = locationId ? updateLocationAction : createLocationAction;
  const [state, formAction] = useActionState(action, initialInlineFormState);
  const errorMessage = state?.error ?? null;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="school_id" value={schoolId} />
      {locationId ? <input type="hidden" name="location_id" value={locationId} /> : null}
      <div className="space-y-2">
        <Label htmlFor="name">場所の名前</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaults?.name ?? ""}
          placeholder="ルーム1"
          className="h-11 rounded-xl border-emerald-100"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">タイプ</Label>
        <select
          id="type"
          name="type"
          className="h-11 w-full rounded-xl border border-emerald-100 bg-white px-4 text-sm outline-none transition focus:border-emerald-300"
          defaultValue={defaults?.type ?? "room"}
        >
          <option value="room">教室内ルーム</option>
          <option value="home_visit">出張(生徒宅)</option>
          <option value="external">その他外部施設</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="area_id">エリア</Label>
        <select
          id="area_id"
          name="area_id"
          className="h-11 w-full rounded-xl border border-emerald-100 bg-white px-4 text-sm outline-none transition focus:border-emerald-300"
          defaultValue={defaults?.areaId ?? ""}
        >
          <option value="">未設定</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">メモ</Label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={defaults?.notes ?? ""}
          className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100/70"
        />
      </div>
      <FormErrorMessage message={errorMessage} />
      <div className="flex justify-end">
        <SubmitButton
          label={locationId ? "更新する" : "追加する"}
          pendingLabel={locationId ? "更新中..." : "追加中..."}
        />
      </div>
    </form>
  );
}
