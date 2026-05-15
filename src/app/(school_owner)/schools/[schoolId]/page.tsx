import Link from "next/link";
import {
  CalendarDays,
  Grid2x2,
  Mail,
  MapPin,
  School,
  Settings2,
  UserRound,
  Users,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import {
  updateCancellationPolicyAction,
  updateLocationSettingsAction,
} from "@/actions/locations";
import { DeleteSchoolDialog } from "@/components/schools/delete-school-dialog";
import { PendingSubmitButton } from "@/components/shared/pending-submit-button";
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
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SchoolRow = {
  id: string;
  name: string;
  description?: string | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  location_management_enabled?: boolean;
  buffer_same_location_minutes?: number;
  buffer_same_area_minutes?: number;
  buffer_different_area_minutes?: number;
  cancellation_deadline_hours?: number;
  late_cancellation_policy?: string;
};

type LocationRow = {
  id: string;
  name: string;
  type: string;
  area?: { name?: string | null } | Array<{ name?: string | null }> | null;
};

const locationTypeLabel = (type: string) => {
  if (type === "room") return "ROOM";
  if (type === "home_visit") return "HOME";
  return "EXTERNAL";
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
    .is("deleted_at", null)
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
        .eq("school_id", schoolId)
        .is("deleted_at", null),
      supabase
        .from("school_teachers")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId),
      supabase
        .from("students")
        .select("user_id")
        .eq("school_id", schoolId)
        .is("deleted_at", null),
    ]);

  const [
    { data: areas, error: areasError },
    { data: locations, error: locationsError },
  ] = await Promise.all([
    supabase
      .from("areas")
      .select("id, name")
      .eq("school_id", schoolId)
      .is("deleted_at", null)
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
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
  ]);

  const { count: reservationCount } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("school_id", schoolId);

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
  const typedLocations = (locations ?? []) as LocationRow[];

  return (
    <div className="min-h-[720px] px-5 py-6 md:px-8 md:py-8">
      <div className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-500">
        <Link href="/schools" className="transition hover:text-slate-800">
          教室
        </Link>
        <span>›</span>
        <span className="text-slate-700">{typedSchool.name}</span>
      </div>

      <section className="relative mb-6 overflow-hidden rounded-[24px] border border-[#e7efeb] bg-[linear-gradient(135deg,#ffffff_0%,#f1fbf5_100%)] px-5 py-6 shadow-[0_18px_36px_rgba(31,41,55,0.04)] md:px-8 md:py-8">
        <div className="absolute right-[-80px] top-[-80px] h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(168,232,200,0.28)_0%,transparent_65%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4 md:items-center md:gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#bcefd4] via-[#a4e6c4] to-[#7fddb0] text-[#27463a] shadow-[0_10px_24px_rgba(127,221,176,0.28)]">
              <School className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 md:text-5xl">
                  {typedSchool.name}
                </h1>
                <span className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-bold text-emerald-700">
                  • {typedSchool.subscription_plan ?? "Light"} ·{" "}
                  {typedSchool.subscription_status ?? "Active"}
                </span>
              </div>
              <p className="mt-4 text-base leading-7 text-slate-500">
                {typedSchool.description?.trim() || "教室の説明はまだありません"}
              </p>
            </div>
          </div>

          <Link
            href={`/schools/${schoolId}`}
            className={buttonVariants({
              variant: "secondary",
              className:
                "w-full rounded-2xl border border-slate-200 bg-white px-6 text-slate-800 hover:bg-slate-50 sm:w-auto",
            })}
          >
            教室情報を編集
          </Link>
        </div>
      </section>

      <section className="mb-6 grid gap-4 xl:grid-cols-3">
        {[
          {
            label: "生徒数",
            value: `${studentCount ?? 0}`,
            unit: "人",
            sub: "先月比 ±0",
            icon: UserRound,
          },
          {
            label: "講師数",
            value: `${teacherCount ?? 0}`,
            unit: "人",
            sub: "先月比 ±0",
            icon: Users,
            accent: true,
          },
          {
            label: "今月のレッスン数",
            value: `${lessonCount ?? 0}`,
            unit: "件",
            sub: "5月の実績",
            icon: CalendarDays,
          },
        ].map(({ label, value, unit, sub, icon: Icon, accent }) => (
          <div
            key={label}
            className={cn(
              "rounded-[22px] border bg-white px-6 py-6 shadow-[0_14px_28px_rgba(31,41,55,0.04)]",
              accent ? "border-emerald-200" : "border-[#e8efec]"
            )}
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dff4e8] text-emerald-700">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-[2.2rem] font-extrabold tracking-tight text-slate-800">
                  {value}
                  <span className="ml-1 text-base font-semibold text-slate-400">
                    {unit}
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-400">{sub}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-[22px] border border-[#e8efec] bg-white shadow-[0_14px_28px_rgba(31,41,55,0.04)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff4e8] text-emerald-700">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-xl text-slate-800 md:text-2xl">
                  講師
                  <span className="ml-3 text-sm font-medium text-slate-400">
                    {teacherCount ?? 0}人
                  </span>
                </CardTitle>
                <CardDescription className="mt-3 text-sm leading-7 text-slate-500">
                  教室に所属している講師の一覧を確認します。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link
              href={`/schools/${schoolId}/teachers`}
              className="flex items-center justify-between rounded-2xl bg-[#f1faf5] px-5 py-4 text-sm font-semibold text-slate-800 transition hover:bg-[#e8f6ef]"
            >
              <span>講師一覧を見る</span>
              <span className="text-emerald-600">→</span>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-[#e8efec] bg-white shadow-[0_14px_28px_rgba(31,41,55,0.04)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff4e8] text-emerald-700">
                <UserRound className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-xl text-slate-800 md:text-2xl">
                  生徒
                  <span className="ml-3 text-sm font-medium text-slate-400">
                    {studentCount ?? 0}人
                  </span>
                </CardTitle>
                <CardDescription className="mt-3 text-sm leading-7 text-slate-500">
                  生徒一覧と担当講師の紐付きを確認します。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link
              href={`/schools/${schoolId}/students`}
              className="flex items-center justify-between rounded-2xl bg-[#f1faf5] px-5 py-4 text-sm font-semibold text-slate-800 transition hover:bg-[#e8f6ef]"
            >
              <span>生徒一覧を見る</span>
              <span className="text-emerald-600">→</span>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="mb-4">
        <Card className="rounded-[22px] border border-[#e8efec] bg-white shadow-[0_14px_28px_rgba(31,41,55,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff4e8] text-emerald-700">
                <Mail className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-xl text-slate-800 md:text-2xl">招待</CardTitle>
                <CardDescription className="mt-2 text-sm leading-7 text-slate-500">
                  講師や生徒の招待リンクを発行して管理します。
                </CardDescription>
              </div>
            </div>
            <Link
              href={`/schools/${schoolId}/invitations`}
              className={buttonVariants({
                variant: "secondary",
                className:
                  "rounded-2xl border border-slate-200 bg-white px-5 text-slate-800 hover:bg-slate-50",
              })}
            >
              招待を管理する →
            </Link>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="rounded-[22px] border border-emerald-200 bg-white shadow-[0_14px_28px_rgba(31,41,55,0.04)]">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff4e8] text-emerald-700">
                  <Grid2x2 className="h-4 w-4" />
                </span>
                <CardTitle className="text-2xl text-slate-800">
                  エリア
                  <span className="ml-3 text-sm font-medium text-slate-400">
                    {areas?.length ?? 0}件
                  </span>
                </CardTitle>
              </div>
              <CardDescription className="mt-3 pl-[52px] text-sm leading-7 text-slate-500">
                出張先や拠点をざっくりまとめる単位です。
              </CardDescription>
            </div>
            <Link
              href={`/schools/${schoolId}/areas/new`}
              className={buttonVariants({
                size: "sm",
                className:
                  "rounded-2xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
              })}
            >
              追加
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {areas?.length ? (
              areas.map((area) => (
                <Link
                  key={area.id}
                  href={`/schools/${schoolId}/areas/${area.id}/edit`}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-[#fcfefd] px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-[#f7fbf8]"
                >
                  <span>{area.name}</span>
                  <span className="text-slate-400">編集</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500">まだエリアは登録されていません。</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-[#e8efec] bg-white shadow-[0_14px_28px_rgba(31,41,55,0.04)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff4e8] text-emerald-700">
                <Settings2 className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-2xl text-slate-800">
                  場所設定
                </CardTitle>
                <CardDescription className="mt-3 text-sm leading-7 text-slate-500">
                  予約時に場所選択と移動バッファを使うか設定します。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form action={updateLocationSettingsAction} className="space-y-4">
              <input type="hidden" name="school_id" value={schoolId} />

              <label className="flex items-center justify-between rounded-2xl bg-[#f1faf5] px-5 py-4 text-sm font-semibold text-slate-700">
                <span>場所管理を有効にする</span>
                <input
                  type="checkbox"
                  name="location_management_enabled"
                  defaultChecked={typedSchool.location_management_enabled ?? false}
                  className="h-5 w-5 rounded border-slate-200 text-emerald-600"
                />
              </label>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">
                  移動バッファ（分）
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      id: "buffer_same_location_minutes",
                      label: "同一場所",
                      defaultValue: typedSchool.buffer_same_location_minutes ?? 0,
                    },
                    {
                      id: "buffer_same_area_minutes",
                      label: "同一エリア",
                      defaultValue: typedSchool.buffer_same_area_minutes ?? 30,
                    },
                    {
                      id: "buffer_different_area_minutes",
                      label: "異なるエリア",
                      defaultValue:
                        typedSchool.buffer_different_area_minutes ?? 60,
                    },
                  ].map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label
                        htmlFor={field.id}
                        className="text-xs font-semibold text-slate-500"
                      >
                        {field.label}
                      </label>
                      <input
                        id={field.id}
                        name={field.id}
                        type="number"
                        min="0"
                        defaultValue={field.defaultValue}
                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-300"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <PendingSubmitButton
                className={buttonVariants({
                  className:
                    "rounded-2xl bg-[#2bb57f] text-white hover:bg-[#25a774]",
                })}
                pendingLabel="更新中..."
              >
                場所設定を更新
              </PendingSubmitButton>
            </form>

            <div className="h-px bg-slate-100" />

            <form action={updateCancellationPolicyAction} className="space-y-4">
              <input type="hidden" name="school_id" value={schoolId} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="cancellation_deadline_hours"
                    className="text-sm font-semibold text-slate-700"
                  >
                    キャンセル期限（時間前）
                  </label>
                  <input
                    id="cancellation_deadline_hours"
                    name="cancellation_deadline_hours"
                    type="number"
                    min="0"
                    defaultValue={typedSchool.cancellation_deadline_hours ?? 24}
                    className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-300"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="late_cancellation_policy"
                    className="text-sm font-semibold text-slate-700"
                  >
                    期限後の扱い
                  </label>
                  <select
                    id="late_cancellation_policy"
                    name="late_cancellation_policy"
                    defaultValue={typedSchool.late_cancellation_policy ?? "consume"}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-300"
                  >
                    <option value="consume">消化扱いでキャンセル可</option>
                    <option value="no_cancel">キャンセル不可</option>
                  </select>
                </div>
              </div>
              <PendingSubmitButton
                className={buttonVariants({
                  variant: "secondary",
                  className:
                    "rounded-2xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                })}
                pendingLabel="更新中..."
              >
                キャンセルポリシーを更新
              </PendingSubmitButton>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <Card className="rounded-[22px] border border-emerald-200 bg-white shadow-[0_14px_28px_rgba(31,41,55,0.04)]">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff4e8] text-emerald-700">
                  <MapPin className="h-4 w-4" />
                </span>
                <CardTitle className="text-2xl text-slate-800">
                  場所一覧
                  <span className="ml-3 text-sm font-medium text-slate-400">
                    {typedLocations.length}件
                  </span>
                </CardTitle>
              </div>
              <CardDescription className="mt-3 pl-[52px] text-sm leading-7 text-slate-500">
                予約時に選べる教室内ルームや訪問先です。
              </CardDescription>
            </div>
            <Link
              href={`/schools/${schoolId}/locations/new`}
              className={buttonVariants({
                size: "sm",
                className:
                  "rounded-2xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
              })}
            >
              追加
            </Link>
          </CardHeader>
          <CardContent className="grid gap-3">
            {typedLocations.length ? (
              typedLocations.map((location) => {
                const area = Array.isArray(location.area)
                  ? location.area[0]
                  : location.area;

                return (
                  <Link
                    key={location.id}
                    href={`/schools/${schoolId}/locations/${location.id}/edit`}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-[#fcfefd] px-5 py-4 transition hover:border-emerald-200 hover:bg-[#f7fbf8]"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f6ec] text-emerald-700">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-2xl font-bold tracking-tight text-slate-800">
                          {location.name}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                          <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold tracking-[0.06em] text-emerald-600">
                            {locationTypeLabel(location.type)}
                          </span>
                          {area?.name ? <span>{area.name}エリア</span> : null}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-400">編集</span>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">まだ場所は登録されていません。</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 flex items-center justify-between gap-4 rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-6">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-500">
            <School className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold text-slate-800">教室を削除</p>
            <p className="text-sm leading-7 text-slate-500">
              この操作は取り消せません。生徒・講師・レッスン履歴が全て削除されます。
            </p>
          </div>
        </div>
        <DeleteSchoolDialog
          schoolId={schoolId}
          schoolName={typedSchool.name}
          counts={{
            areaCount: areas?.length ?? 0,
            locationCount: typedLocations.length,
            studentCount: studentCount ?? 0,
            teacherCount: teacherCount ?? 0,
            reservationCount: reservationCount ?? 0,
          }}
        />
      </section>
    </div>
  );
}
