import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "");

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Resend API key not configured, email not sent");
    return { success: false, error: "API key not configured" };
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL ??
    process.env.EMAIL_FROM ??
    "onboarding@resend.dev";
  const fromName = process.env.RESEND_FROM_NAME ?? "AllIn Note";

  try {
    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
