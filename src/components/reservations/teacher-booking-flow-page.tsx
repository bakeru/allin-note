"use client";

import { useRouter } from "next/navigation";

import {
  BookingFlow,
  type BookingLocation,
  type BookingStudent,
} from "@/components/reservations/booking-flow";

type TeacherBookingFlowPageProps = {
  teacherId: string;
  schoolId: string;
  locationManagementEnabled: boolean;
  students: BookingStudent[];
  locations: BookingLocation[];
};

export function TeacherBookingFlowPage(props: TeacherBookingFlowPageProps) {
  const router = useRouter();

  return (
    <BookingFlow
      {...props}
      mode="teacher"
      onComplete={() => {
        router.push("/reservations");
        router.refresh();
      }}
    />
  );
}
