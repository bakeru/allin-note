"use client";

import { useRouter } from "next/navigation";

import {
  BookingFlow,
  type BookingLocation,
} from "@/components/reservations/booking-flow";

type StudentBookingFlowPageProps = {
  studentId: string;
  teacherId: string;
  schoolId: string;
  locationManagementEnabled: boolean;
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
