"use client";

import { useMemo, useState } from "react";

import { createInvitationAction } from "@/actions/auth";
import { buttonVariants } from "@/components/ui/button";

type TeacherOption = {
  id: string;
  name: string;
};

type LocationOption = {
  id: string;
  name: string;
};

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
  const submitLabel = useMemo(
    () => (role === "teacher" ? "招待リンクを発行" : "招待リンクを発行"),
    [role]
  );

  return (
    <form action={createInvitationAction} className="space-y-6">
      <input type="hidden" name="school_id" value={schoolId} />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-neutral-900">招待タイプ</legend>
        <label className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3">
          <input
            type="radio"
            name="role"
            value="teacher"
            checked={role === "teacher"}
            onChange={() => setRole("teacher")}
          />
          <span>講師</span>
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3">
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
        <label htmlFor="email" className="text-sm font-medium text-neutral-900">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none transition focus:border-neutral-400"
        />
      </div>

      {role === "teacher" ? (
        <div className="space-y-2">
          <label
            htmlFor="teacher_role"
            className="text-sm font-medium text-neutral-900"
          >
            講師の役割
          </label>
          <select
            id="teacher_role"
            name="teacher_role"
            className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
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
            <label
              htmlFor="student_name"
              className="text-sm font-medium text-neutral-900"
            >
              生徒の名前
            </label>
            <input
              id="student_name"
              name="student_name"
              className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none transition focus:border-neutral-400"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="student_teacher_id"
              className="text-sm font-medium text-neutral-900"
            >
              担当講師
            </label>
            <select
              id="student_teacher_id"
              name="student_teacher_id"
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
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
              className="text-sm font-medium text-neutral-900"
            >
              デフォルト場所
            </label>
            <select
              id="default_location_id"
              name="default_location_id"
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
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

      <button type="submit" className={buttonVariants({ className: "w-full" })}>
        {submitLabel}
      </button>
    </form>
  );
}
