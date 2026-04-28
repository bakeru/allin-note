import { escapeHtml, formatDate, renderEmailShell } from "./utils";

type StudentInvitationParams = {
  schoolName: string;
  inviterName: string;
  invitationUrl: string;
  expiresAt: Date;
  studentName?: string | null;
};

export function studentInvitationEmail(params: StudentInvitationParams) {
  const expiresAtStr = formatDate(params.expiresAt);
  const greetingName = params.studentName?.trim()
    ? `${escapeHtml(params.studentName)}さん`
    : "生徒・保護者の方";

  return {
    subject: `[AllIn Note] ${params.schoolName}への生徒招待`,
    html: renderEmailShell({
      title: `${params.schoolName}への招待`,
      body: `
        <p>${greetingName}、こんにちは。</p>
        <p>「${escapeHtml(params.schoolName)}」の${escapeHtml(params.inviterName)}さんから、AllIn Note への参加招待が届いています。</p>
        <div style="margin: 30px 0;">
          <a href="${params.invitationUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            招待を承諾して登録する
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">このリンクは ${expiresAtStr} まで有効です。</p>
        <p style="color: #666; font-size: 14px;">
          もしボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください。<br>
          <a href="${params.invitationUrl}" style="color: #0066cc; word-break: break-all;">${params.invitationUrl}</a>
        </p>
      `,
    }),
  };
}
