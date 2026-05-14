"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { addDays } from "date-fns";

import { createReservationByPayload } from "@/actions/reservations";
import { DateAvailabilityCalendar } from "@/components/reservations/date-availability-calendar";
import { TimePickerCalendar } from "@/components/reservations/time-picker-calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatJstDateKey,
  formatJstDateLabel,
  formatJstDateTimeLabel,
  formatJstTimeLabel,
} from "@/lib/reservations/jst";
import { cn } from "@/lib/utils";

type BookingFlowProps = {
  mode: "teacher" | "student";
  studentId?: string;
  teacherId: string;
  schoolId: string;
  locationManagementEnabled: boolean;
  onComplete: (reservationId: string) => void;
  students?: BookingStudent[];
  teachers?: BookingTeacher[];
  locations?: BookingLocation[];
  defaultLocationId?: string | null;
};

export type BookingStudent = {
  id: string;
  displayName: string;
  defaultLocationId?: string | null;
};

export type BookingTeacher = {
  id: string;
  displayName: string;
  roleLabel?: string | null;
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

type ReservationSlotStage = "date" | "time";

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
  teachers = [],
  locations = [],
  defaultLocationId = null,
}: BookingFlowProps) {
  const [selectedStudentId, setSelectedStudentId] = useState(
    studentId ?? students[0]?.id ?? ""
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    teacherId ?? teachers[0]?.id ?? ""
  );
  const [selectedLocationId, setSelectedLocationId] = useState(
    defaultLocationId ?? ""
  );
  const [duration, setDuration] = useState(60);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [stepIndex, setStepIndex] = useState(0);
  const [slots, setSlots] = useState<SlotResponse[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [reservationSlotStage, setReservationSlotStage] =
    useState<ReservationSlotStage>("date");
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [slotWindow, setSlotWindow] = useState(() => {
    const startDate = new Date();
    return {
      startDate,
      endDate: addDays(startDate, 14),
    };
  });
  const [isPending, startTransition] = useTransition();

  const activeStudent = useMemo(
    () => students.find((entry) => entry.id === selectedStudentId) ?? null,
    [selectedStudentId, students]
  );
  const activeTeacher = useMemo(
    () => teachers.find((entry) => entry.id === selectedTeacherId) ?? null,
    [selectedTeacherId, teachers]
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

    if (mode === "student") {
      nextSteps.push("講師");
    }

    if (locationManagementEnabled) {
      nextSteps.push("場所");
    }

    nextSteps.push("レッスン時間");
    nextSteps.push("予約可能枠");
    nextSteps.push("確認");

    return nextSteps;
  }, [locationManagementEnabled, mode]);

  const canLoadSlots =
    !!selectedStudentId &&
    !!selectedTeacherId &&
    !!duration &&
    (!locationManagementEnabled || !!selectedLocationId);

  useEffect(() => {
    if (!canLoadSlots) {
      setSlots([]);
      return;
    }

    const startDate = new Date();
    const endDate = addDays(startDate, 14);
    setSlotWindow({ startDate, endDate });
    const search = new URLSearchParams({
      schoolId,
      teacherId: selectedTeacherId,
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
        setSelectedSlot("");
        const availableDateKeys = Array.from(
          new Set(body.slots.map((slot) => formatJstDateKey(new Date(slot.startTime))))
        );
        setSelectedDateKey((current) =>
          current && availableDateKeys.includes(current)
            ? current
            : availableDateKeys[0] ?? null
        );
        setReservationSlotStage("date");
      })
      .catch((error) => {
        setSlots([]);
        setSelectedSlot("");
        setSelectedDateKey(null);
        setReservationSlotStage("date");
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
    selectedTeacherId,
  ]);

  const slotsByDate = useMemo(() => {
    return slots.reduce<Record<string, SlotResponse[]>>((accumulator, slot) => {
      const dateKey = formatJstDateKey(new Date(slot.startTime));
      accumulator[dateKey] = [...(accumulator[dateKey] ?? []), slot];
      return accumulator;
    }, {});
  }, [slots]);

  const availabilityByDate = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(slotsByDate).map(([dateKey, dateSlots]) => [
          dateKey,
          dateSlots.length,
        ])
      ),
    [slotsByDate]
  );

  const selectedDateSlots = useMemo(
    () => (selectedDateKey ? slotsByDate[selectedDateKey] ?? [] : []),
    [selectedDateKey, slotsByDate]
  );

  const timePickerSlots = useMemo(
    () =>
      selectedDateSlots.map((slot) => ({
        slotKey: slot.startTime,
        startTime: formatJstTimeLabel(new Date(slot.startTime)),
        endTime: formatJstTimeLabel(new Date(slot.endTime)),
      })),
    [selectedDateSlots]
  );

  const selectedLocation =
    locations.find((entry) => entry.id === selectedLocationId) ?? null;

  const selectedSlotRecord =
    slots.find((slot) => slot.startTime === selectedSlot) ?? null;
  const selectedSlotDate = selectedSlotRecord
    ? new Date(selectedSlotRecord.startTime)
    : null;
  const slotWindowStartDateKey = formatJstDateKey(slotWindow.startDate);
  const slotWindowEndDateKey = formatJstDateKey(slotWindow.endDate);
  const isReservationStep = steps[stepIndex] === "予約可能枠";

  const next = () => setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  const back = () => setStepIndex((current) => Math.max(current - 1, 0));
  const selectDate = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setSelectedSlot("");
    setReservationSlotStage("time");
  };

  const submit = () => {
    if (!selectedStudentId || !selectedTeacherId || !selectedSlotDate) {
      setSubmitError("必要な項目を選択してください。");
      return;
    }

    setSubmitError(null);
    startTransition(async () => {
      try {
        const reservationId = await createReservationByPayload({
          schoolId,
          teacherId: selectedTeacherId,
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

          {steps[stepIndex] === "講師" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-950">
                  担当講師を選ぶ
                </h2>
                <p className="text-sm text-neutral-600">
                  初期設定の講師をもとにしつつ、必要に応じて変更できます。
                </p>
              </div>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                <span>レッスン担当の講師</span>
                <select
                  value={selectedTeacherId}
                  onChange={(event) => setSelectedTeacherId(event.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                >
                  <option value="">講師を選択してください</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.displayName}
                      {teacher.roleLabel ? ` (${teacher.roleLabel})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              {activeTeacher ? (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm font-medium text-neutral-950">
                    {activeTeacher.displayName}
                  </p>
                  {activeTeacher.roleLabel ? (
                    <p className="mt-1 text-xs text-neutral-500">
                      {activeTeacher.roleLabel}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {steps[stepIndex] === "場所" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-950">場所を選ぶ</h2>
                <p className="text-sm text-neutral-600">
                  初期設定をもとにしつつ、その都度変更できます。
                </p>
              </div>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                <span>レッスン場所</span>
                <select
                  value={selectedLocationId}
                  onChange={(event) => setSelectedLocationId(event.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                >
                  <option value="">場所を選択してください</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                      {location.areaName ? ` / ${location.areaName}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              {selectedLocation ? (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="font-medium text-neutral-950">
                    {selectedLocation.name}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {getLocationTypeLabel(selectedLocation.type)}
                    {selectedLocation.areaName
                      ? ` / ${selectedLocation.areaName}`
                      : ""}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {steps[stepIndex] === "レッスン時間" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-950">
                  レッスン時間を選ぶ
                </h2>
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

          {steps[stepIndex] === "予約可能枠" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-neutral-950">
                  予約が取れる時間を確認する
                </h2>
                <p className="text-sm text-neutral-600">
                  まず日付を選び、そのあとで時間を選びます。
                </p>
              </div>
              {isFetchingSlots ? (
                <p className="text-sm text-neutral-500">
                  予約可能な時間を探しています...
                </p>
              ) : null}
              {slotsError ? (
                <p className="text-sm text-red-600">{slotsError}</p>
              ) : null}
              {!isFetchingSlots && !slots.length && !slotsError ? (
                <p className="text-sm text-neutral-500">
                  条件に合う予約可能な時間が見つかりませんでした。
                </p>
              ) : null}
              {!isFetchingSlots && slots.length ? (
                reservationSlotStage === "date" ? (
                  <DateAvailabilityCalendar
                    availabilityByDate={availabilityByDate}
                    minDateKey={slotWindowStartDateKey}
                    maxDateKey={slotWindowEndDateKey}
                    selectedDateKey={selectedDateKey}
                    onSelectDate={selectDate}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-[#d7ece0] bg-[#f8fcfa] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7fbf9e]">
                            Step 2
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-slate-950">
                            時間を選ぶ
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {selectedDateKey
                              ? `${formatJstDateLabel(selectedDateKey)} の空き枠です。`
                              : "日付を選び直してください。"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSlot("");
                            setReservationSlotStage("date");
                          }}
                          className="self-start text-sm font-medium text-[#249768] underline underline-offset-4 transition hover:text-[#1c7a54]"
                        >
                          日付を選び直す
                        </button>
                      </div>
                    </div>
                    <TimePickerCalendar
                      lessonMin={duration}
                      selectedSlotKey={selectedSlot || null}
                      slots={timePickerSlots}
                      onSelect={setSelectedSlot}
                    />
                    {selectedSlotRecord ? (
                      <div className="rounded-2xl border border-[#d7ece0] bg-[#eff9f3] px-4 py-3 text-sm text-[#1c5d44]">
                        選択中:{" "}
                        <span className="font-semibold">
                          {formatJstDateTimeLabel(
                            new Date(selectedSlotRecord.startTime)
                          )}
                          {" - "}
                          {formatJstTimeLabel(
                            new Date(selectedSlotRecord.endTime)
                          )}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">
                        予約したい時間をひとつ選んでください。
                      </p>
                    )}
                  </div>
                )
              ) : null}
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
                {mode === "student" ? (
                  <div>
                    <dt className="text-neutral-500">担当講師</dt>
                    <dd className="mt-1 font-medium text-neutral-950">
                      {activeTeacher?.displayName ?? "未選択"}
                    </dd>
                  </div>
                ) : null}
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
                    {selectedSlotRecord
                      ? `${formatJstDateTimeLabel(
                          new Date(selectedSlotRecord.startTime)
                        )} - ${formatJstTimeLabel(
                          new Date(selectedSlotRecord.endTime)
                        )}`
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
                  (steps[stepIndex] === "講師" && !selectedTeacherId) ||
                  (steps[stepIndex] === "場所" && !selectedLocationId) ||
                  (steps[stepIndex] === "予約可能枠" &&
                    (reservationSlotStage !== "time" || !selectedSlot))
                }
              >
                {isReservationStep ? "この時間で確認する" : "次へ"}
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
