const DEFAULT_TIME_ZONE = "Asia/Tokyo";

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function nl2br(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: DEFAULT_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value);
}

export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: DEFAULT_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function renderEmailShell(params: {
  title: string;
  body: string;
}) {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
    <h1 style="color: #1a1a1a; margin-bottom: 24px;">${escapeHtml(params.title)}</h1>
    ${params.body}
    <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
    <p style="color: #999; font-size: 12px; line-height: 1.6;">
      このメールは AllIn Note から自動送信されています。<br>
      心当たりがない場合は、このメールを破棄してください。
    </p>
  </div>
`;
}
