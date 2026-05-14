"use client";

import { useRouter } from "next/navigation";

import {
  BookingFlow,
  type BookingLocation,
  type BookingTeacher,
} from "@/components/reservations/booking-flow";

type StudentBookingFlowPageProps = {
  studentId: string;
  teacherId: string;
  schoolId: string;
  locationManagementEnabled: boolean;
  teachers: BookingTeacher[];
  locations: BookingLocation[];
  defaultLocationId?: string | null;
};

export function StudentBookingFlowPage(props: StudentBookingFlowPageProps) {
  const router = useRouter();

  return (
    <BookingFlow
      {...props}
      mode="student"
      onComplete={() => {
        router.push("/student/dashboard");
        router.refresh();
      }}
    />
  );
}
