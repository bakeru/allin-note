"use client";

import { useMemo, useState } from "react";
import { Camera, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AvatarPaletteItem = {
  label: string;
  className: string;
  ringClassName: string;
};

const avatarPalette: AvatarPaletteItem[] = [
  {
    label: "sage",
    className: "bg-[#dff4e8] text-emerald-700",
    ringClassName: "ring-emerald-500",
  },
  {
    label: "peach",
    className: "bg-[#fce4c0] text-[#b5762e]",
    ringClassName: "ring-[#f2b86d]",
  },
  {
    label: "lilac",
    className: "bg-[#e5ddf5] text-[#6b4fa8]",
    ringClassName: "ring-[#8f71d8]",
  },
  {
    label: "sky",
    className: "bg-[#d8e5f4] text-[#3d5c8a]",
    ringClassName: "ring-[#78a8df]",
  },
  {
    label: "blossom",
    className: "bg-[#f8d8dd] text-[#a85068]",
    ringClassName: "ring-[#e58ea7]",
  },
  {
    label: "amber",
    className: "bg-[#ffe7c7] text-[#c4843d]",
    ringClassName: "ring-[#f0b66e]",
  },
];

function getInitial(displayName: string) {
  return Array.from(displayName.trim())[0] ?? "A";
}

export function AvatarSettingsCard({ displayName }: { displayName: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedPalette = avatarPalette[selectedIndex] ?? avatarPalette[0];
  const initial = useMemo(() => getInitial(displayName), [displayName]);

  return (
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
          aria-label="閉じる"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <CardContent className="px-7 py-7">
        <div className="mb-6 flex items-center gap-5 rounded-[18px] bg-[#f2faf6] px-5 py-5">
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold transition-colors ${selectedPalette.className}`}
          >
            {initial}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-400">現在のアイコン</p>
            <p className="mt-1 text-xl font-bold text-slate-800">{displayName}</p>
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
          {avatarPalette.map((item, index) => {
            const isSelected = index === selectedIndex;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-pressed={isSelected}
                className={`relative flex aspect-square items-center justify-center rounded-full text-xl font-bold transition hover:scale-105 ${item.className} ${
                  isSelected
                    ? `ring-2 ring-offset-2 ring-offset-white ${item.ringClassName}`
                    : ""
                }`}
              >
                {initial}
                {isSelected ? (
                  <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-[10px] font-bold text-white">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </CardContent>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-[#fbfdfc] px-7 py-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-2xl border-slate-200 bg-white"
        >
          キャンセル
        </Button>
        <Button
          type="button"
          className="flex-1 rounded-2xl bg-[#2bb57f] text-white hover:bg-[#25a774]"
        >
          保存する
        </Button>
      </div>
    </Card>
  );
}
