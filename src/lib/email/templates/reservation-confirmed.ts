import { escapeHtml, formatDateTime, renderEmailShell } from "./utils";

type ReservationConfirmedParams = {
  recipientName: string;
  reservationDate: Date;
  durationMinutes: number;
  locationName: string | null;
  teacherName: string;
  studentName: string;
  reservationUrl: string;
};

export function reservationConfirmedEmail(params: ReservationConfirmedParams) {
  const dateTime = formatDateTime(params.reservationDate);

  return {
    subject: `[AllIn Note] 予約が確定しました (${dateTime})`,
    html: renderEmailShell({
      title: "予約が確定しました",
      body: `
        <p>${escapeHtml(params.recipientName)}さん、こんにちは。</p>
        <p>以下の内容で予約が確定しました。</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0; line-height: 1.8;">
          <div><strong>日時:</strong> ${dateTime}</div>
          <div><strong>所要時間:</strong> ${params.durationMinutes}分</div>
          <div><strong>講師:</strong> ${escapeHtml(params.teacherName)}</div>
          <div><strong>生徒:</strong> ${escapeHtml(params.studentName)}</div>
          <div><strong>場所:</strong> ${escapeHtml(params.locationName ?? "未設定")}</div>
        </div>
        <div style="margin: 30px 0;">
          <a href="${params.reservationUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            予約内容を確認する
          </a>
        </div>
      `,
    }),
  };
}
