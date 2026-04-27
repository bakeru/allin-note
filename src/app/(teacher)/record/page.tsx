import Link from "next/link";
import { redirect } from "next/navigation";

import { ReservationCard } from "@/components/reservations/reservation-card";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { findTodayReservations } from "@/lib/reservations/find-current";

export const dynamic = "force-dynamic";

export default async function RecordPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/");
  }

  const reservations = await findTodayReservations(user.id);
  const activeReservations = reservations.filter(
    (reservation) => reservation.status !== "completed"
  );
  const completedReservations = reservations.filter(
    (reservation) => reservation.status === "completed"
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col gap-6 px-5 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-neutral-950">録音</h1>
        <p className="text-sm leading-6 text-neutral-600">
          今日の予約から録音するレッスンを選びます。予約外の録音も下から始められます。
        </p>
      </div>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-neutral-950">今日の予約</h2>
          <p className="text-sm text-neutral-600">時刻順に表示しています。</p>
        </div>

        {reservations.length > 0 ? (
          <>
            {activeReservations.length > 0 ? (
              <div className="space-y-3">
                {activeReservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    variant="active"
                  />
                ))}
              </div>
            ) : (
              <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
                <CardContent className="py-8 text-sm text-neutral-600">
                  今日の予約はすべて録音済みです。
                </CardContent>
              </Card>
            )}

            {completedReservations.length > 0 ? (
              <div className="space-y-3 pt-2 opacity-60">
                <h3 className="text-sm font-medium text-neutral-500">録音済み</h3>
                {completedReservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    variant="completed"
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
            <CardContent className="py-8 text-center text-sm text-neutral-500">
              今日の予約はまだありません
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4 border-t border-neutral-200 pt-8">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-neutral-950">
            予約以外で録音する場合
          </h2>
          <p className="text-sm text-neutral-600">
            その場で生徒を選ぶか、先に予約を作ることもできます。
          </p>
        </div>

        <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardHeader>
            <CardTitle className="text-2xl">手動で録音を始める</CardTitle>
            <CardDescription>
              予約がない場合や、別の流れで始めたい場合はこちらを使います。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/record/select-student"
              className={buttonVariants({ size: "lg" })}
            >
              生徒を選んで録音
            </Link>
            <Link
              href="/reservations/new"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              予約を作って録音
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
