import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  updateCancellationPolicyAction,
  updateLocationSettingsAction,
} from "@/actions/locations";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type SchoolRow = {
  id: string;
  name: string;
  description?: string | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
};

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    redirect("/");
  }

  const supabase = createServiceClient();
  const { data: school, error } = await supabase
    .from("schools")
    .select("*")
    .eq("id", schoolId)
    .eq("owner_id", user.id)
    .single();

  if (error) {
    if (error.message.includes("public.schools")) {
      redirect("/schools");
    }

    throw new Error(error.message);
  }

  if (!school) {
    notFound();
  }

  const [{ count: studentCount }, { count: teacherCount }, { data: students }] =
    await Promise.all([
      supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId),
      supabase
        .from("school_teachers")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId),
      supabase.from("students").select("user_id").eq("school_id", schoolId),
    ]);

  const [
    { data: areas, error: areasError },
    { data: locations, error: locationsError },
  ] = await Promise.all([
    supabase
      .from("areas")
      .select("id, name")
      .eq("school_id", schoolId)
      .order("name", { ascending: true }),
    supabase
      .from("locations")
      .select(
        `
          id,
          name,
          type,
          area:areas(name)
        `
      )
      .eq("school_id", schoolId)
      .order("created_at", { ascending: true }),
  ]);

  if (areasError && !areasError.message.includes("public.areas")) {
    throw new Error(areasError.message);
  }

  if (locationsError && !locationsError.message.includes("public.locations")) {
    throw new Error(locationsError.message);
  }

  const studentIds = students?.map((student) => student.user_id) ?? [];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: lessonCount } = studentIds.length
    ? await supabase
        .from("lessons")
        .select("*", { count: "exact", head: true })
        .in("student_id", studentIds)
        .gte("recorded_at", startOfMonth.toISOString())
    : { count: 0 };

  const typedSchool = school as SchoolRow;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-8 px-5 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/schools"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            教室一覧へ戻る
          </Link>
          <h1 className="text-3xl font-semibold text-neutral-950">
            {typedSchool.name}
          </h1>
          <p className="text-sm leading-6 text-neutral-600">
            {typedSchool.description?.trim() || "教室の説明はまだありません。"}
          </p>
        </div>
        <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800">
          {typedSchool.subscription_plan ?? "light"} /{" "}
          {typedSchool.subscription_status ?? "active"}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "生徒数", value: `${studentCount ?? 0}人` },
          { label: "講師数", value: `${teacherCount ?? 0}人` },
          { label: "今月のレッスン数", value: `${lessonCount ?? 0}件` },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="rounded-lg border-0 bg-white ring-1 ring-neutral-200"
          >
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl text-neutral-950">
                {stat.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardHeader>
            <CardTitle className="text-xl text-neutral-950">講師</CardTitle>
            <CardDescription>
              教室に所属している講師の一覧を確認します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/schools/${schoolId}/teachers`}
              className={buttonVariants({ variant: "outline" })}
            >
              講師一覧を見る
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardHeader>
            <CardTitle className="text-xl text-neutral-950">生徒</CardTitle>
            <CardDescription>
              生徒一覧と担当講師の紐付きを確認します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/schools/${schoolId}/students`}
              className={buttonVariants({ variant: "outline" })}
            >
              生徒一覧を見る
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl text-neutral-950">エリア</CardTitle>
              <CardDescription>
                出張先や拠点をざっくりまとめる単位です。
              </CardDescription>
            </div>
            <Link
              href={`/schools/${schoolId}/areas/new`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              エリアを追加
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {areas?.length ? (
              areas.map((area) => (
                <Link
                  key={area.id}
                  href={`/schools/${schoolId}/areas/${area.id}/edit`}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm text-neutral-700 transition hover:border-neutral-400"
                >
                  <span>{area.name}</span>
                  <span className="text-neutral-400">編集</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-neutral-500">まだエリアは登録されていません。</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardHeader>
            <CardTitle className="text-xl text-neutral-950">場所設定</CardTitle>
            <CardDescription>
              予約時に場所選択と移動バッファを使うか設定します。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form action={updateLocationSettingsAction} className="space-y-4">
              <input type="hidden" name="school_id" value={schoolId} />
              <label className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  name="location_management_enabled"
                  defaultChecked={(typedSchool as SchoolRow & {
                    location_management_enabled?: boolean;
                  }).location_management_enabled ?? false}
                />
                場所管理を有効にする
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label
                    htmlFor="buffer_same_location_minutes"
                    className="text-sm font-medium text-neutral-700"
                  >
                    同一場所
                  </label>
                  <input
                    id="buffer_same_location_minutes"
                    name="buffer_same_location_minutes"
                    type="number"
                    min="0"
                    defaultValue={
                      (typedSchool as SchoolRow & {
                        buffer_same_location_minutes?: number;
                      }).buffer_same_location_minutes ?? 0
                    }
                    className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none transition focus:border-neutral-400"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="buffer_same_area_minutes"
                    className="text-sm font-medium text-neutral-700"
                  >
                    同一エリア
                  </label>
                  <input
                    id="buffer_same_area_minutes"
                    name="buffer_same_area_minutes"
                    type="number"
                    min="0"
                    defaultValue={
                      (typedSchool as SchoolRow & {
                        buffer_same_area_minutes?: number;
                      }).buffer_same_area_minutes ?? 30
                    }
                    className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none transition focus:border-neutral-400"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="buffer_different_area_minutes"
                    className="text-sm font-medium text-neutral-700"
                  >
                    異なるエリア
                  </label>
                  <input
                    id="buffer_different_area_minutes"
                    name="buffer_different_area_minutes"
                    type="number"
                    min="0"
                    defaultValue={
                      (typedSchool as SchoolRow & {
                        buffer_different_area_minutes?: number;
                      }).buffer_different_area_minutes ?? 60
                    }
                    className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none transition focus:border-neutral-400"
                  />
                </div>
              </div>
              <button type="submit" className={buttonVariants()}>
                場所設定を更新
              </button>
            </form>

            <form action={updateCancellationPolicyAction} className="space-y-4">
              <input type="hidden" name="school_id" value={schoolId} />
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
                <div className="space-y-2">
                  <label
                    htmlFor="cancellation_deadline_hours"
                    className="text-sm font-medium text-neutral-700"
                  >
                    キャンセル期限(時間前)
                  </label>
                  <input
                    id="cancellation_deadline_hours"
                    name="cancellation_deadline_hours"
                    type="number"
                    min="0"
                    defaultValue={
                      (typedSchool as SchoolRow & {
                        cancellation_deadline_hours?: number;
                      }).cancellation_deadline_hours ?? 24
                    }
                    className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none transition focus:border-neutral-400"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="late_cancellation_policy"
                    className="text-sm font-medium text-neutral-700"
                  >
                    期限後の扱い
                  </label>
                  <select
                    id="late_cancellation_policy"
                    name="late_cancellation_policy"
                    defaultValue={
                      (typedSchool as SchoolRow & {
                        late_cancellation_policy?: string;
                      }).late_cancellation_policy ?? "consume"
                    }
                    className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
                  >
                    <option value="consume">消化扱いでキャンセル可</option>
                    <option value="no_cancel">キャンセル不可</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className={buttonVariants({ variant: "outline" })}
              >
                キャンセルポリシーを更新
              </button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl text-neutral-950">場所一覧</CardTitle>
            <CardDescription>
              予約時に選べる教室内ルームや訪問先です。
            </CardDescription>
          </div>
          <Link
            href={`/schools/${schoolId}/locations/new`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            場所を追加
          </Link>
        </CardHeader>
        <CardContent className="grid gap-3">
          {locations?.length ? (
            locations.map((location) => {
              const area = Array.isArray(location.area)
                ? location.area[0]
                : location.area;

              return (
                <Link
                  key={location.id}
                  href={`/schools/${schoolId}/locations/${location.id}/edit`}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm text-neutral-700 transition hover:border-neutral-400"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-neutral-950">{location.name}</p>
                    <p className="text-neutral-500">
                      {location.type}
                      {area?.name ? ` / ${area.name}` : ""}
                    </p>
                  </div>
                  <span className="text-neutral-400">編集</span>
                </Link>
              );
            })
          ) : (
            <p className="text-sm text-neutral-500">まだ場所は登録されていません。</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
