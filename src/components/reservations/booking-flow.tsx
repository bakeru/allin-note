"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { addDays, format } from "date-fns";
import { ja } from "date-fns/locale";

import { createReservationByPayload } from "@/actions/reservations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BookingFlowProps = {
  mode: "teacher" | "student";
  studentId?: string;
  teacherId: string;
  schoolId: string;
  locationManagementEnabled: boolean;
  onComplete: (reservationId: string) => void;
  students?: BookingStudent[];
  locations?: BookingLocation[];
  defaultLocationId?: string | null;
};

export type BookingStudent = {
  id: string;
  displayName: string;
  defaultLocationId?: string | null;
};

export type BookingLocation = {
  id: string;
  name: string;
  type: string;
  areaName?: string | null;
};

type SlotResponse = {
  startTime: string;
  endTime: string;
};

const DURATION_OPTIONS = [30, 45, 60, 90];

const getLocationTypeLabel = (type: string) => {
  switch (type) {
    case "room":
      return "教室内ルーム";
    case "home_visit":
      return "出張(生徒宅)";
    default:
      return "その他外部施設";
  }
};

export function BookingFlow({
  mode,
  studentId,
  teacherId,
  schoolId,
  locationManagementEnabled,
  onComplete,
  students = [],
  locations = [],
  defaultLocationId = null,
}: BookingFlowProps) {
  const [selectedStudentId, setSelectedStudentId] = useState(
    studentId ?? students[0]?.id ?? ""
  );
  const [selectedLocationId, setSelectedLocationId] = useState(
    defaultLocationId ?? ""
  );
  const [duration, setDuration] = useState(60);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [stepIndex, setStepIndex] = useState(0);
  const [slots, setSlots] = useState<SlotResponse[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeStudent = useMemo(
    () => students.find((entry) => entry.id === selectedStudentId) ?? null,
    [selectedStudentId, students]
  );
  const studentLabel =
    activeStudent?.displayName ?? (mode === "student" ? "あなた" : "未選択");

  useEffect(() => {
    if (mode === "teacher" && activeStudent?.defaultLocationId) {
      setSelectedLocationId(activeStudent.defaultLocationId);
    }
  }, [activeStudent?.defaultLocationId, mode]);

  const steps = useMemo(() => {
    const nextSteps: string[] = [];

    if (mode === "teacher") {
      nextSteps.push("生徒");
    }

    if (locationManagementEnabled) {
      nextSteps.push("場所");
    }

    nextSteps.push("時間");
    nextSteps.push("日時");
    nextSteps.push("確認");

    return nextSteps;
  }, [locationManagementEnabled, mode]);

  const canLoadSlots =
    !!selectedStudentId &&
    !!duration &&
    (!locationManagementEnabled || !!selectedLocationId);

  useEffect(() => {
    if (!canLoadSlots) {
      setSlots([]);
      return;
    }

    const startDate = new Date();
    const endDate = addDays(startDate, 14);
    const search = new URLSearchParams({
      schoolId,
      teacherId,
      durationMinutes: `${duration}`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (selectedLocationId) {
      search.set("locationId", selectedLocationId);
    }

    setIsFetchingSlots(true);
    setSlotsError(null);

    fetch(`/api/reservations/available-slots?${search.toString()}`)
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? "空き時間の取得に失敗しました。");
        }

        return response.json() as Promise<{ slots: SlotResponse[] }>;
      })
      .then((body) => {
        setSlots(body.slots);
        if (!body.slots.find((slot) => slot.startTime === selectedSlot)) {
          setSelectedSlot(body.slots[0]?.startTime ?? "");
        }
      })
      .catch((error) => {
        setSlots([]);
        setSlotsError(
          error instanceof Error
            ? error.message
            : "空き時間の取得に失敗しました。"
        );
      })
      .finally(() => {
        setIsFetchingSlots(false);
      });
  }, [
    canLoadSlots,
    duration,
    schoolId,
    selectedLocationId,
    selectedSlot,
    teacherId,
  ]);

  const groupedSlots = useMemo(() => {
    const groups = new Map<string, SlotResponse[]>();

    slots.forEach((slot) => {
      const key = format(new Date(slot.startTime), "yyyy-MM-dd");
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    });

    return Array.from(groups.entries());
  }, [slots]);

  const selectedLocation =
    locations.find((entry) => entry.id === selectedLocationId) ?? null;

  const selectedSlotDate = selectedSlot ? new Date(selectedSlot) : null;

  const next = () => setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  const back = () => setStepIndex((current) => Math.max(current - 1, 0));

  const submit = () => {
    if (!selectedStudentId || !selectedSlotDate) {
      setSubmitError("必要な項目を選択してください。");
      return;
    }

    setSubmitError(null);
    startTransition(async () => {
      try {
        const reservationId = await createReservationByPayload({
          schoolId,
          teacherId,
          studentId: selectedStudentId,
          scheduledAt: selectedSlotDate.toISOString(),
          durationMinutes: duration,
          locationId: selectedLocationId || null,
        });
        onComplete(reservationId);
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "予約に失敗しました。"
        );
      }
    });
  };

  if (locationManagementEnabled && locations.length === 0) {
    return (
      <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardHeader>
          <CardTitle className="text-2xl">場所を先に登録してください</CardTitle>
          <CardDescription>
            場所管理が有効ですが、まだ場所が登録されていません。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href={`/schools/${schoolId}`}
            className="text-sm font-medium text-neutral-700 underline underline-offset-4"
          >
            場所を追加する
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {steps.map((step, index) => (
          <div
            key={step}
            className={cn(
              "rounded-full px-3 py-1 text-sm",
              index === stepIndex
                ? "bg-neutral-950 text-white"
                : "bg-neutral-100 text-neutral-500"
            )}
          >
            {index + 1}. {step}
          </div>
        ))}
      </div>

      <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardContent className="space-y-6 py-6">
          {steps[stepIndex] === "生徒" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-950">生徒を選ぶ</h2>
                <p className="text-sm text-neutral-600">
                  今回の予約を入れる生徒を選択します。
                </p>
              </div>
              <div className="grid gap-3">
                {students.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => setSelectedStudentId(student.id)}
                    className={cn(
                      "rounded-lg border p-4 text-left transition",
                      selectedStudentId === student.id
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400"
                    )}
                  >
                    {student.displayName}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {steps[stepIndex] === "場所" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-950">場所を選ぶ</h2>
                <p className="text-sm text-neutral-600">
                  予約場所に応じて移動バッファを考慮します。
                </p>
              </div>
              <div className="grid gap-3">
                {locations.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => setSelectedLocationId(location.id)}
                    className={cn(
                      "rounded-lg border p-4 text-left transition",
                      selectedLocationId === location.id
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400"
                    )}
                  >
                    <p className="font-medium">{location.name}</p>
                    <p
                      className={cn(
                        "mt-1 text-sm",
                        selectedLocationId === location.id
                          ? "text-white/80"
                          : "text-neutral-500"
                      )}
                    >
                      {getLocationTypeLabel(location.type)}
                      {location.areaName ? ` / ${location.areaName}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {steps[stepIndex] === "時間" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-950">所要時間</h2>
                <p className="text-sm text-neutral-600">
                  予約したいレッスン時間を選びます。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDuration(option)}
                    className={cn(
                      "rounded-lg border px-4 py-3 text-sm font-medium transition",
                      duration === option
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400"
                    )}
                  >
                    {option}分
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {steps[stepIndex] === "日時" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-950">日時を選ぶ</h2>
                <p className="text-sm text-neutral-600">
                  今日から2週間先までの予約可能枠です。
                </p>
              </div>
              {isFetchingSlots ? (
                <p className="text-sm text-neutral-500">予約可能な時間を探しています...</p>
              ) : null}
              {slotsError ? <p className="text-sm text-red-600">{slotsError}</p> : null}
              {!isFetchingSlots && !slots.length && !slotsError ? (
                <p className="text-sm text-neutral-500">
                  条件に合う予約可能な時間が見つかりませんでした。
                </p>
              ) : null}
              <div className="space-y-4">
                {groupedSlots.map(([dateKey, dateSlots]) => (
                  <section key={dateKey} className="space-y-2">
                    <h3 className="text-sm font-semibold text-neutral-700">
                      {format(new Date(dateKey), "M月d日(E)", { locale: ja })}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {dateSlots.map((slot) => {
                        const slotDate = new Date(slot.startTime);
                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            onClick={() => setSelectedSlot(slot.startTime)}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-sm transition",
                              selectedSlot === slot.startTime
                                ? "border-neutral-950 bg-neutral-950 text-white"
                                : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400"
                            )}
                          >
                            {format(slotDate, "HH:mm")}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : null}

          {steps[stepIndex] === "確認" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-950">確認</h2>
                <p className="text-sm text-neutral-600">内容に問題なければ予約します。</p>
              </div>
              <dl className="grid gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
                <div>
                  <dt className="text-neutral-500">生徒</dt>
                    <dd className="mt-1 font-medium text-neutral-950">
                    {studentLabel}
                  </dd>
                </div>
                {locationManagementEnabled ? (
                  <div>
                    <dt className="text-neutral-500">場所</dt>
                    <dd className="mt-1 font-medium text-neutral-950">
                      {selectedLocation?.name ?? "未選択"}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-neutral-500">所要時間</dt>
                  <dd className="mt-1 font-medium text-neutral-950">{duration}分</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">日時</dt>
                  <dd className="mt-1 font-medium text-neutral-950">
                    {selectedSlotDate
                      ? format(selectedSlotDate, "yyyy年M月d日(E) HH:mm", {
                          locale: ja,
                        })
                      : "未選択"}
                  </dd>
                </div>
              </dl>
              {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" onClick={back} disabled={stepIndex === 0}>
              戻る
            </Button>
            {stepIndex < steps.length - 1 ? (
              <Button
                type="button"
                onClick={next}
                disabled={
                  (steps[stepIndex] === "生徒" && !selectedStudentId) ||
                  (steps[stepIndex] === "場所" && !selectedLocationId) ||
                  (steps[stepIndex] === "日時" && !selectedSlot)
                }
              >
                次へ
              </Button>
            ) : (
              <Button type="button" onClick={submit} disabled={isPending || !selectedSlot}>
                {isPending ? "予約中..." : "予約する"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
