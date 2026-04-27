import { createServiceClient } from "@/lib/supabase/service";

export type TimeSlot = {
  startTime: Date;
  endTime: Date;
};

type SchoolSettings = {
  buffer_same_location_minutes: number;
  buffer_same_area_minutes: number;
  buffer_different_area_minutes: number;
};

type LocationRecord = {
  id: string;
  type: string;
  area_id: string | null;
};

type ReservationRecord = {
  scheduled_at: string;
  duration_minutes: number | null;
  location_id: string | null;
};

export function calculateRequiredBuffer(
  schoolSettings: SchoolSettings,
  loc1: LocationRecord,
  loc2: LocationRecord
) {
  if (loc1.id === loc2.id) {
    return schoolSettings.buffer_same_location_minutes;
  }

  if (loc1.type === "room" && loc2.type === "room") {
    return schoolSettings.buffer_same_location_minutes;
  }

  if (loc1.area_id && loc2.area_id && loc1.area_id === loc2.area_id) {
    return schoolSettings.buffer_same_area_minutes;
  }

  return schoolSettings.buffer_different_area_minutes;
}

const overlaps = (
  candidateStart: Date,
  candidateEnd: Date,
  existingStart: Date,
  existingEnd: Date
) => candidateStart < existingEnd && candidateEnd > existingStart;

export async function getAvailableTimeSlots(
  schoolId: string,
  teacherId: string,
  locationId: string | null,
  durationMinutes: number,
  startDate: Date,
  endDate: Date
): Promise<TimeSlot[]> {
  const supabase = createServiceClient();
  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select(
      "location_management_enabled, buffer_same_location_minutes, buffer_same_area_minutes, buffer_different_area_minutes"
    )
    .eq("id", schoolId)
    .single();

  if (schoolError) {
    throw new Error(schoolError.message);
  }

  const { data: reservations, error: reservationError } = await supabase
    .from("reservations")
    .select("scheduled_at, duration_minutes, location_id")
    .eq("teacher_id", teacherId)
    .eq("status", "scheduled")
    .gte("scheduled_at", startDate.toISOString())
    .lte("scheduled_at", endDate.toISOString());

  if (reservationError) {
    throw new Error(reservationError.message);
  }

  let selectedLocation: LocationRecord | null = null;
  const locationCache = new Map<string, LocationRecord>();

  if (locationId) {
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("id, type, area_id")
      .eq("id", locationId)
      .single();

    if (locationError) {
      throw new Error(locationError.message);
    }

    selectedLocation = location as LocationRecord;
    locationCache.set(selectedLocation.id, selectedLocation);
  }

  const reservationLocations = Array.from(
    new Set(
      (reservations ?? [])
        .map((reservation) => reservation.location_id)
        .filter((value): value is string => !!value)
    )
  ).filter((id) => !locationCache.has(id));

  if (reservationLocations.length) {
    const { data: locations, error: locationsError } = await supabase
      .from("locations")
      .select("id, type, area_id")
      .in("id", reservationLocations);

    if (locationsError) {
      throw new Error(locationsError.message);
    }

    (locations ?? []).forEach((location) => {
      locationCache.set(location.id, location as LocationRecord);
    });
  }

  const slots: TimeSlot[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const finalDay = new Date(endDate);
  finalDay.setHours(0, 0, 0, 0);

  while (cursor <= finalDay) {
    for (let minutes = 9 * 60; minutes + durationMinutes <= 21 * 60; minutes += 30) {
      const candidateStart = new Date(cursor);
      candidateStart.setHours(0, minutes, 0, 0);
      const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60 * 1000);

      const blocked = (reservations as ReservationRecord[] | null)?.some((reservation) => {
        const existingStart = new Date(reservation.scheduled_at);
        const existingEnd = new Date(
          existingStart.getTime() + (reservation.duration_minutes ?? 60) * 60 * 1000
        );

        if (!school.location_management_enabled || !locationId || !reservation.location_id) {
          return overlaps(candidateStart, candidateEnd, existingStart, existingEnd);
        }

        const existingLocation = locationCache.get(reservation.location_id);
        if (!selectedLocation || !existingLocation) {
          return overlaps(candidateStart, candidateEnd, existingStart, existingEnd);
        }

        const buffer = calculateRequiredBuffer(
          school as SchoolSettings,
          selectedLocation,
          existingLocation
        );
        const bufferedStart = new Date(existingStart.getTime() - buffer * 60 * 1000);
        const bufferedEnd = new Date(existingEnd.getTime() + buffer * 60 * 1000);

        return overlaps(candidateStart, candidateEnd, bufferedStart, bufferedEnd);
      });

      if (!blocked && candidateStart >= startDate && candidateEnd <= endDate) {
        slots.push({ startTime: candidateStart, endTime: candidateEnd });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return slots;
}
