"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

type TimePickerCalendarSlot = {
  slotKey: string;
  startTime: string;
  endTime: string;
};

type TimePickerCalendarProps = {
  lessonMin: number;
  selectedSlotKey: string | null;
  slots: TimePickerCalendarSlot[];
  onSelect: (slotKey: string) => void;
};

const HOUR_HEIGHT = 56;
const START_HOUR = 9;
const END_HOUR = 23;

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const positionedSlots = (slots: TimePickerCalendarSlot[], lessonMin: number) => {
  const normalized = slots
    .map((slot) => {
      const startMinutes = timeToMinutes(slot.startTime);
      const endMinutes = timeToMinutes(slot.endTime);

      return {
        ...slot,
        startMinutes,
        endMinutes:
          endMinutes > startMinutes ? endMinutes : startMinutes + lessonMin,
      };
    })
    .sort(
      (left, right) =>
        left.startMinutes - right.startMinutes || left.endMinutes - right.endMinutes
    );

  const clusters: typeof normalized[] = [];
  let currentCluster: typeof normalized = [];
  let currentClusterEnd = -1;

  normalized.forEach((slot) => {
    if (!currentCluster.length || slot.startMinutes < currentClusterEnd) {
      currentCluster.push(slot);
      currentClusterEnd = Math.max(currentClusterEnd, slot.endMinutes);
      return;
    }

    clusters.push(currentCluster);
    currentCluster = [slot];
    currentClusterEnd = slot.endMinutes;
  });

  if (currentCluster.length) {
    clusters.push(currentCluster);
  }

  return clusters.flatMap((cluster) => {
    const laneEnds: number[] = [];

    const withLane = cluster.map((slot) => {
      let laneIndex = laneEnds.findIndex((laneEnd) => laneEnd <= slot.startMinutes);

      if (laneIndex === -1) {
        laneIndex = laneEnds.length;
        laneEnds.push(slot.endMinutes);
      } else {
        laneEnds[laneIndex] = slot.endMinutes;
      }

      return { ...slot, laneIndex };
    });

    const laneCount = Math.max(laneEnds.length, 1);

    return withLane.map((slot) => ({ ...slot, laneCount }));
  });
};

export function TimePickerCalendar({
  lessonMin,
  selectedSlotKey,
  slots,
  onSelect,
}: TimePickerCalendarProps) {
  const totalHours = END_HOUR - START_HOUR;
  const totalHeight = totalHours * HOUR_HEIGHT;

  const layoutSlots = useMemo(
    () => positionedSlots(slots, lessonMin),
    [lessonMin, slots]
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-[#d7ece0] bg-white shadow-sm">
      <div
        className="grid grid-cols-[54px_1fr]"
        style={{ minHeight: totalHeight }}
      >
        <div className="border-r border-[#e5efea] bg-[#fbfdfc]">
          {Array.from({ length: totalHours + 1 }, (_, index) => {
            const hour = START_HOUR + index;

            return (
              <div
                key={hour}
                style={{ height: HOUR_HEIGHT }}
                className="relative border-b border-transparent"
              >
                <span className="absolute -top-2 right-2 rounded bg-[#fbfdfc] px-1 text-[10px] font-medium text-slate-400">
                  {`${String(hour).padStart(2, "0")}:00`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="relative bg-white" style={{ height: totalHeight }}>
          {Array.from({ length: totalHours + 1 }, (_, index) => (
            <div
              key={`line-${index}`}
              className="absolute inset-x-0 border-t border-[#e7efea]"
              style={{ top: index * HOUR_HEIGHT }}
            />
          ))}
          {Array.from({ length: totalHours }, (_, index) => (
            <div
              key={`half-${index}`}
              className="absolute inset-x-0 border-t border-dashed border-[#d9e7df] opacity-70"
              style={{ top: index * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
            />
          ))}

          {layoutSlots.map((slot) => {
            const isSelected = slot.slotKey === selectedSlotKey;
            const offsetMinutes = slot.startMinutes - START_HOUR * 60;
            const top = (offsetMinutes / 60) * HOUR_HEIGHT;
            const height = ((slot.endMinutes - slot.startMinutes) / 60) * HOUR_HEIGHT;
            const left = (100 / slot.laneCount) * slot.laneIndex;
            const width = 100 / slot.laneCount;

            return (
              <button
                key={slot.slotKey}
                type="button"
                onClick={() => onSelect(slot.slotKey)}
                className={cn(
                  "absolute rounded-2xl border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[#8fe2b8] focus:ring-offset-2",
                  isSelected
                    ? "border-[#39ae78] bg-[#57c793] text-white shadow-md"
                    : "border-[#bfe7cf] bg-[#eaf9f0] text-[#196947] hover:bg-[#dff6ea]"
                )}
                style={{
                  top: top + 2,
                  left: `calc(${left}% + 4px)`,
                  width: `calc(${width}% - 8px)`,
                  height: Math.max(height - 4, 32),
                }}
              >
                <span className="block text-[12px] font-semibold leading-5 sm:text-[13px]">
                  {slot.startTime} - {slot.endTime}
                </span>
                <span
                  className={cn(
                    "mt-1 block text-[10px]",
                    isSelected ? "text-white/85" : "text-[#2a7c58]/80"
                  )}
                >
                  {isSelected ? "選択中" : "タップで選択"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
