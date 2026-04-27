"use client";

import { useId, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SummaryDisplay, type StudentSummaryValue } from "@/components/lessons/summary-display";

type SummaryEditorProps = {
  lessonId: string;
  initialSummary: StudentSummaryValue | null;
  originalSummary: StudentSummaryValue | null;
  editedCount: number;
  editedAt: string | null;
  canEdit: boolean;
  onSubmit: (formData: FormData) => void | Promise<void>;
};

type EditableStudentSummary = {
  learned: string[];
  achievements: string[];
  homework: string[];
  next_lesson_note: string;
};

const normalizeSummary = (
  summary: StudentSummaryValue | null | undefined
): EditableStudentSummary => ({
  learned: summary?.learned?.filter(Boolean) ?? [],
  achievements: summary?.achievements?.filter(Boolean) ?? [],
  homework: summary?.homework?.filter(Boolean) ?? [],
  next_lesson_note: summary?.next_lesson_note ?? "",
});

const areListsEqual = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((item, index) => item === right[index]);

const isFieldChanged = (
  current: EditableStudentSummary,
  original: EditableStudentSummary,
  field: keyof EditableStudentSummary
) => {
  if (field === "next_lesson_note") {
    return current.next_lesson_note !== original.next_lesson_note;
  }

  return !areListsEqual(
    current[field] as string[],
    original[field] as string[]
  );
};

const getFieldChangeCount = (
  current: EditableStudentSummary,
  original: EditableStudentSummary,
  field: keyof EditableStudentSummary
) => {
  if (field === "next_lesson_note") {
    return current.next_lesson_note !== original.next_lesson_note ? 1 : 0;
  }

  const currentItems = current[field] as string[];
  const originalItems = original[field] as string[];
  const maxLength = Math.max(currentItems.length, originalItems.length);
  let changed = 0;

  for (let index = 0; index < maxLength; index += 1) {
    if ((currentItems[index] ?? "") !== (originalItems[index] ?? "")) {
      changed += 1;
    }
  }

  return changed;
};

const formatEditedAt = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const SECTION_META: Array<{
  field: keyof EditableStudentSummary;
  title: string;
  addLabel?: string;
  multiline?: boolean;
}> = [
  { field: "learned", title: "今日学んだこと", addLabel: "項目を追加" },
  { field: "achievements", title: "よくできた点", addLabel: "項目を追加" },
  { field: "homework", title: "次回までの宿題", addLabel: "項目を追加" },
  { field: "next_lesson_note", title: "次回予定", multiline: true },
];

export function SummaryEditor({
  lessonId,
  initialSummary,
  originalSummary,
  editedCount,
  editedAt,
  canEdit,
  onSubmit,
}: SummaryEditorProps) {
  const formId = useId();
  const normalizedInitial = useMemo(
    () => normalizeSummary(initialSummary),
    [initialSummary]
  );
  const normalizedOriginal = useMemo(
    () => normalizeSummary(originalSummary),
    [originalSummary]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<EditableStudentSummary>(normalizedInitial);
  const [showFirstDialog, setShowFirstDialog] = useState(false);
  const [showSecondDialog, setShowSecondDialog] = useState(false);
  const [showOriginalDialog, setShowOriginalDialog] = useState(false);

  const changeSummaries = useMemo(() => {
    return SECTION_META.map(({ field, title }) => {
      const changeCount = getFieldChangeCount(draft, normalizedInitial, field);
      if (!changeCount) return null;

      return `「${title}」を${changeCount}項目編集`;
    }).filter((value): value is string => value !== null);
  }, [draft, normalizedInitial]);

  const startEditing = () => {
    setDraft(normalizedInitial);
    setIsEditing(true);
    setShowFirstDialog(false);
  };

  const cancelEditing = () => {
    setDraft(normalizedInitial);
    setIsEditing(false);
    setShowSecondDialog(false);
  };

  const resetToInitial = () => {
    setDraft(normalizedInitial);
  };

  const updateListItem = (
    field: "learned" | "achievements" | "homework",
    index: number,
    value: string
  ) => {
    setDraft((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) =>
        itemIndex === index ? value : item
      ),
    }));
  };

  const addListItem = (field: "learned" | "achievements" | "homework") => {
    setDraft((current) => ({
      ...current,
      [field]: [...current[field], ""],
    }));
  };

  const removeListItem = (
    field: "learned" | "achievements" | "homework",
    index: number
  ) => {
    setDraft((current) => ({
      ...current,
      [field]: current[field].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const serializedSummary = JSON.stringify({
    learned: draft.learned.filter((item) => item.trim()),
    achievements: draft.achievements.filter((item) => item.trim()),
    homework: draft.homework.filter((item) => item.trim()),
    next_lesson_note: draft.next_lesson_note.trim(),
  });

  return (
    <div className="space-y-5">
      <form id={formId} action={onSubmit} className="space-y-5">
        <input type="hidden" name="lesson_id" value={lessonId} />
        <input type="hidden" name="summary_json" value={serializedSummary} />

        {isEditing ? (
          <div className="space-y-6 rounded-lg border border-amber-200 bg-amber-50/40 p-4">
            {SECTION_META.map(({ field, title, addLabel }) => {
              const changed = isFieldChanged(draft, normalizedInitial, field);

              if (field === "next_lesson_note") {
                return (
                  <section key={field} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-neutral-950">
                        {title}
                      </h3>
                      {changed ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          編集済み
                        </span>
                      ) : null}
                    </div>
                    <textarea
                      value={draft.next_lesson_note}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          next_lesson_note: event.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm leading-6 text-neutral-900 outline-none transition focus:border-neutral-400"
                    />
                  </section>
                );
              }

              const items = draft[field] as string[];

              return (
                <section key={field} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-neutral-950">
                      {title}
                    </h3>
                    {changed ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        編集済み
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    {items.length ? (
                      items.map((item, index) => (
                        <div key={`${field}-${index}`} className="flex gap-2">
                          <input
                            value={item}
                            onChange={(event) =>
                              updateListItem(field, index, event.target.value)
                            }
                            className="h-10 flex-1 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeListItem(field, index)}
                          >
                            削除
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-500">項目はまだありません。</p>
                    )}
                  </div>

                  {addLabel ? (
                    <button
                      type="button"
                      onClick={() => addListItem(field)}
                      className="text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
                    >
                      {addLabel}
                    </button>
                  ) : null}
                </section>
              );
            })}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={resetToInitial}>
                元に戻す
              </Button>
              <Button type="button" variant="ghost" onClick={cancelEditing}>
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={() => setShowSecondDialog(true)}
                disabled={!changeSummaries.length}
              >
                変更を保存
              </Button>
            </div>
          </div>
        ) : (
          <SummaryDisplay
            summary={normalizedInitial}
            emptyMessage="生徒向け要約はまだありません"
          />
        )}
      </form>

      {!isEditing ? (
        canEdit ? (
          <button
            type="button"
            onClick={() => setShowFirstDialog(true)}
            className="text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-700"
          >
            修正が必要な場合は、こちら
          </button>
        ) : (
          <p className="text-sm text-neutral-400">
            送信済みのため要約は編集できません
          </p>
        )
      ) : null}

      <div className="space-y-2 border-t border-neutral-200 pt-4 text-sm text-neutral-500">
        <p>編集履歴</p>
        <p>編集回数: {editedCount}回</p>
        <p>最終編集: {editedAt ? formatEditedAt(editedAt) : "まだありません"}</p>
        <button
          type="button"
          onClick={() => setShowOriginalDialog(true)}
          className="underline underline-offset-4 hover:text-neutral-700"
        >
          オリジナルを表示
        </button>
      </div>

      <Dialog open={showFirstDialog} onOpenChange={setShowFirstDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>この要約を編集しますか?</DialogTitle>
            <DialogDescription>
              AIが整理した内容を変更すると、事実と異なる記載になる可能性があります。
              間違いの修正が必要な場合にのみ編集してください。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFirstDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={startEditing}>編集を続ける</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSecondDialog} onOpenChange={setShowSecondDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>以下の内容で更新しますか?</DialogTitle>
            <DialogDescription>
              更新後、元のAI生成内容は履歴として保持されます。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-neutral-700">
            <p className="font-medium text-neutral-900">変更内容:</p>
            {changeSummaries.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {changeSummaries.map((summary) => (
                  <li key={summary}>{summary}</li>
                ))}
              </ul>
            ) : (
              <p>変更はありません。</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSecondDialog(false)}>
              キャンセル
            </Button>
            <Button type="submit" form={formId}>
              更新する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showOriginalDialog} onOpenChange={setShowOriginalDialog}>
        <DialogContent className="sm:max-w-lg" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>AI生成のオリジナル要約</DialogTitle>
            <DialogDescription>
              初回編集前の内容を保持しています。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <SummaryDisplay
              summary={normalizedOriginal}
              emptyMessage="保持されているオリジナル要約はありません"
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowOriginalDialog(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
