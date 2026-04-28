import { escapeHtml, formatDate, renderEmailShell } from "./utils";

type TeacherInvitationParams = {
  schoolName: string;
  inviterName: string;
  invitationUrl: string;
  expiresAt: Date;
};

export function teacherInvitationEmail(params: TeacherInvitationParams) {
  const expiresAtStr = formatDate(params.expiresAt);

  return {
    subject: `[AllIn Note] ${params.schoolName}への講師招待`,
    html: renderEmailShell({
      title: `${params.schoolName}への招待`,
      body: `
        <p>こんにちは。</p>
        <p>「${escapeHtml(params.schoolName)}」のオーナー、${escapeHtml(params.inviterName)}さんから、講師としての参加招待が届いています。</p>
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
