import { Camera, Upload, X } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const avatarPalette = [
  { label: "sage", className: "bg-[#dff4e8] text-emerald-700" },
  { label: "peach", className: "bg-[#fce4c0] text-[#b5762e]" },
  { label: "lilac", className: "bg-[#e5ddf5] text-[#6b4fa8]" },
  { label: "sky", className: "bg-[#d8e5f4] text-[#3d5c8a]" },
  { label: "blossom", className: "bg-[#f8d8dd] text-[#a85068]" },
  { label: "amber", className: "bg-[#ffe7c7] text-[#c4843d]" },
];

export const dynamic = "force-dynamic";

export default async function SchoolOwnerSettingsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    redirect("/");
  }

  return (
    <div className="flex min-h-[720px] items-center justify-center bg-[rgba(15,31,46,0.08)] px-8 py-10">
      <Card className="w-full max-w-[560px] overflow-hidden rounded-[26px] border border-[#e8efec] bg-white shadow-[0_30px_80px_rgba(31,41,55,0.14)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
              プロフィール画像を変更
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              オーナー用の表示アイコンを選択できます。
            </p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <CardContent className="px-7 py-7">
          <div className="mb-6 flex items-center gap-5 rounded-[18px] bg-[#f2faf6] px-5 py-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#dff4e8] text-2xl font-bold text-emerald-700">
              {user.display_name.slice(0, 1)}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-400">現在のアイコン</p>
              <p className="mt-1 text-xl font-bold text-slate-800">
                {user.display_name}
              </p>
            </div>
          </div>

          <div className="mb-7 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-slate-200 bg-white px-4 py-5 text-sm font-semibold text-slate-500 transition hover:border-emerald-200 hover:bg-[#f5fbf8] hover:text-emerald-700"
            >
              <Upload className="h-5 w-5" />
              ファイルからアップロード
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-slate-200 bg-white px-4 py-5 text-sm font-semibold text-slate-500 transition hover:border-emerald-200 hover:bg-[#f5fbf8] hover:text-emerald-700"
            >
              <Camera className="h-5 w-5" />
              写真を撮る
            </button>
          </div>

          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              テンプレートから選ぶ
            </p>
          </div>

          <div className="grid grid-cols-6 gap-3">
            {avatarPalette.map((item, index) => (
              <button
                key={`${item.label}-${index}`}
                type="button"
                className={`relative flex aspect-square items-center justify-center rounded-full text-xl font-bold transition hover:scale-105 ${item.className} ${
                  index === 0
                    ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-white"
                    : ""
                }`}
              >
                {index < 3 ? user.display_name.slice(0, 1) : String.fromCharCode(30000 + index).slice(0, 1)}
                {index === 0 ? (
                  <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-[10px] font-bold text-white">
                    ✓
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </CardContent>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-[#fbfdfc] px-7 py-4">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl border-slate-200 bg-white"
          >
            キャンセル
          </Button>
          <Button className="flex-1 rounded-2xl bg-[#2bb57f] text-white hover:bg-[#25a774]">
            保存する
          </Button>
        </div>
      </Card>
    </div>
  );
}
