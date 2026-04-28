import { escapeHtml, formatDate, nl2br, renderEmailShell } from "./utils";

type LessonNoteParams = {
  studentName: string;
  teacherName: string;
  lessonDate: Date;
  teacherMessage: string;
  summary: string;
  lessonUrl: string;
};

export function lessonNoteEmail(params: LessonNoteParams) {
  const dateStr = formatDate(params.lessonDate);

  return {
    subject: `[AllIn Note] ${dateStr}のレッスンノート`,
    html: renderEmailShell({
      title: "レッスンノートが届きました",
      body: `
        <p>${escapeHtml(params.studentName)}さん、こんにちは。</p>
        <p>${dateStr}のレッスンのノートを${escapeHtml(params.teacherName)}先生からお届けします。</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #1a1a1a;">先生からのメッセージ</h2>
          <p style="white-space: pre-wrap;">${nl2br(params.teacherMessage || "メッセージはありません。")}</p>
        </div>
        <div style="margin: 20px 0;">
          <h3 style="color: #1a1a1a;">今日のレッスン</h3>
          <p style="white-space: pre-wrap; line-height: 1.7;">${nl2br(params.summary)}</p>
        </div>
        <div style="margin: 30px 0;">
          <a href="${params.lessonUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            レッスンノートを確認する
          </a>
        </div>
      `,
    }),
  };
}
