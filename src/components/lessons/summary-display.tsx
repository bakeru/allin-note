import { EmptyState } from "@/components/shared/empty-state";

export type StudentSummaryValue = {
  learned?: string[];
  achievements?: string[];
  homework?: string[];
  next_lesson_note?: string;
};

function SummaryList({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  if (!items?.length) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-neutral-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

const hasStudentSummaryContent = (summary: StudentSummaryValue | null) =>
  !!(
    summary?.learned?.length ||
    summary?.achievements?.length ||
    summary?.homework?.length ||
    summary?.next_lesson_note?.trim()
  );

export function SummaryDisplay({
  summary,
  emptyMessage = "生徒向け要約はまだありません",
}: {
  summary: StudentSummaryValue | null;
  emptyMessage?: string;
}) {
  if (!summary || !hasStudentSummaryContent(summary)) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="space-y-5">
      <SummaryList title="今日学んだこと" items={summary.learned} />
      <SummaryList title="よくできた点" items={summary.achievements} />
      <SummaryList title="次回までの宿題" items={summary.homework} />
      {summary.next_lesson_note?.trim() ? (
        <section className="space-y-2">
          <h3 className="text-base font-semibold text-neutral-950">次回予定</h3>
          <p className="text-sm leading-6 text-neutral-700">
            {summary.next_lesson_note}
          </p>
        </section>
      ) : null}
    </div>
  );
}
