"use client";

import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type HiddenField = {
  name: string;
  value: string;
};

export function ConfirmDeleteDialog({
  triggerLabel,
  title,
  description,
  action,
  hiddenFields,
  confirmLabel = "削除する",
}: {
  triggerLabel: string;
  title: string;
  description: string;
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: HiddenField[];
  confirmLabel?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          />
        }
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-xl bg-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {hiddenFields.map((field) => (
            <input
              key={field.name}
              type="hidden"
              name={field.name}
              value={field.value}
            />
          ))}
          <DialogFooter className="border-neutral-200 bg-neutral-50">
            <DialogClose
              render={
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                />
              }
            >
              キャンセル
            </DialogClose>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-rose-600 px-4 text-sm font-medium text-white transition hover:bg-rose-500"
            >
              {confirmLabel}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
