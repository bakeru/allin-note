import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getAvailableTimeSlots } from "@/lib/reservations/get-available-slots";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const schoolId = searchParams.get("schoolId");
  const teacherId = searchParams.get("teacherId");
  const locationId = searchParams.get("locationId");
  const durationMinutes = Number.parseInt(
    searchParams.get("durationMinutes") ?? "",
    10
  );
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!schoolId || !teacherId || !startDate || !endDate) {
    return NextResponse.json(
      { error: "必要なパラメータが不足しています。" },
      { status: 400 }
    );
  }

  if (user.role === "teacher" && user.id !== teacherId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (![30, 45, 60, 90].includes(durationMinutes)) {
    return NextResponse.json(
      { error: "所要時間は30/45/60/90分から選択してください。" },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableTimeSlots(
      schoolId,
      teacherId,
      locationId,
      durationMinutes,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({
      slots: slots.map((slot) => ({
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "空き時間の取得に失敗しました。",
      },
      { status: 500 }
    );
  }
}
