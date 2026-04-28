"use client";

import { useMemo, useState } from "react";

import { deleteSchoolAction } from "@/actions/schools";
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Counts = {
  areaCount: number;
  locationCount: number;
  studentCount: number;
  teacherCount: number;
  reservationCount: number;
};

export function DeleteSchoolDialog({
  schoolId,
  schoolName,
  counts,
}: {
  schoolId: string;
  schoolName: string;
  counts: Counts;
}) {
  const [confirmName, setConfirmName] = useState("");
  const canDelete = useMemo(
    () => confirmName.trim() === schoolName,
    [confirmName, schoolName]
  );

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-rose-200 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
          />
        }
      >
        教室を削除
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-xl bg-white">
        <DialogHeader>
          <DialogTitle>教室を削除</DialogTitle>
          <DialogDescription>
            「{schoolName}」を削除すると、以下のデータも見えなくなります。
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          <ul className="space-y-2">
            <li>エリア: {counts.areaCount}件</li>
            <li>場所: {counts.locationCount}件</li>
            <li>生徒: {counts.studentCount}人</li>
            <li>講師の所属: {counts.teacherCount}人</li>
            <li>予約: {counts.reservationCount}件</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-900">
            この操作は取り消せません。教室名を入力して確認してください。
          </p>
          <input
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
            className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none transition focus:border-neutral-400"
            placeholder={schoolName}
          />
        </div>

        <form action={deleteSchoolAction}>
          <input type="hidden" name="school_id" value={schoolId} />
          <input type="hidden" name="confirm_name" value={confirmName} />
          <DialogFooter className="border-neutral-200 bg-neutral-50">
            <DialogClose
              render={
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                />
              }
            >
              キャンセル
            </DialogClose>
            <button
              type="submit"
              disabled={!canDelete}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-rose-600 px-4 text-sm font-medium text-white transition hover:bg-rose-500 disabled:pointer-events-none disabled:opacity-50"
            >
              削除する
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
