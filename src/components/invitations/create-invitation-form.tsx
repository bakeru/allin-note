"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { createInvitationAction } from "@/actions/auth";
import { initialInlineFormState } from "@/components/shared/action-form-state";
import { FormErrorMessage } from "@/components/shared/form-error-message";

type TeacherOption = {
  id: string;
  name: string;
};

type LocationOption = {
  id: string;
  name: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? "発行中..." : label}
    </button>
  );
}

export function CreateInvitationForm({
  schoolId,
  teachers,
  locations,
}: {
  schoolId: string;
  teachers: TeacherOption[];
  locations: LocationOption[];
}) {
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [state, formAction] = useActionState(
    createInvitationAction,
    initialInlineFormState
  );
  const errorMessage = state?.error ?? null;
  const submitLabel = useMemo(() => "招待リンクを発行", []);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="school_id" value={schoolId} />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-slate-900">招待タイプ</legend>
        <label className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
          <input
            type="radio"
            name="role"
            value="teacher"
            checked={role === "teacher"}
            onChange={() => setRole("teacher")}
          />
          <span>講師</span>
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
          <input
            type="radio"
            name="role"
            value="student"
            checked={role === "student"}
            onChange={() => setRole("student")}
          />
          <span>生徒・保護者</span>
        </label>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-900">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="h-11 w-full rounded-xl border border-emerald-100 px-4 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100/70"
        />
      </div>

      {role === "teacher" ? (
        <div className="space-y-2">
          <label htmlFor="teacher_role" className="text-sm font-medium text-slate-900">
            講師の役割
          </label>
          <select
            id="teacher_role"
            name="teacher_role"
            className="h-11 w-full rounded-xl border border-emerald-100 bg-white px-4 text-sm outline-none transition focus:border-emerald-300"
            defaultValue="teacher"
          >
            <option value="owner">教室共同オーナー</option>
            <option value="head_teacher">主任講師</option>
            <option value="teacher">一般講師</option>
          </select>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="student_name" className="text-sm font-medium text-slate-900">
              生徒の名前
            </label>
            <input
              id="student_name"
              name="student_name"
              className="h-11 w-full rounded-xl border border-emerald-100 px-4 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100/70"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="student_teacher_id"
              className="text-sm font-medium text-slate-900"
            >
              担当講師
            </label>
            <select
              id="student_teacher_id"
              name="student_teacher_id"
              className="h-11 w-full rounded-xl border border-emerald-100 bg-white px-4 text-sm outline-none transition focus:border-emerald-300"
              defaultValue={teachers[0]?.id ?? ""}
            >
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label
              htmlFor="default_location_id"
              className="text-sm font-medium text-slate-900"
            >
              デフォルト場所
            </label>
            <select
              id="default_location_id"
              name="default_location_id"
              className="h-11 w-full rounded-xl border border-emerald-100 bg-white px-4 text-sm outline-none transition focus:border-emerald-300"
              defaultValue=""
            >
              <option value="">未設定</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <FormErrorMessage message={errorMessage} />

      <SubmitButton label={submitLabel} />
    </form>
  );
}
