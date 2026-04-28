import { escapeHtml, formatDateTime, renderEmailShell } from "./utils";

type ReservationCancelledParams = {
  recipientName: string;
  reservationDate: Date;
  cancelledBy: string;
  reason?: string;
  cancellationType: "cancelled" | "cancelled_late" | "cancelled_by_teacher";
};

const getCancellationLabel = (
  cancellationType: ReservationCancelledParams["cancellationType"]
) => {
  switch (cancellationType) {
    case "cancelled_late":
      return "期限後のキャンセルとして記録されました";
    case "cancelled_by_teacher":
      return "講師都合でキャンセルされました";
    default:
      return "キャンセルされました";
  }
};

export function reservationCancelledEmail(params: ReservationCancelledParams) {
  const dateTime = formatDateTime(params.reservationDate);

  return {
    subject: `[AllIn Note] 予約がキャンセルされました (${dateTime})`,
    html: renderEmailShell({
      title: "予約がキャンセルされました",
      body: `
        <p>${escapeHtml(params.recipientName)}さん、こんにちは。</p>
        <p>${dateTime} の予約は、${escapeHtml(params.cancelledBy)}さんによって ${getCancellationLabel(params.cancellationType)}。</p>
        ${
          params.reason?.trim()
            ? `<div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <strong>理由</strong><br>
                ${escapeHtml(params.reason)}
              </div>`
            : ""
        }
      `,
    }),
  };
}
