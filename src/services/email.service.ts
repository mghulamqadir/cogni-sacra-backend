import { BrevoClient } from '@getbrevo/brevo';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { emailTemplates, emailSubjects } from '../templates/emails/email.templates.js';

const brevo = new BrevoClient({ apiKey: env.BREVO_API_KEY });

// ─── DTOs ─────────────────────────────────────────────────────────────────────

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character
  );
}

// ─── Core send ────────────────────────────────────────────────────────────────

async function sendEmail(opts: SendEmailOptions): Promise<void> {
  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: opts.subject,
      htmlContent: opts.html,
      sender: {
        name: env.SENDER_NAME,
        email: env.SENDER_EMAIL,
      },
      to: [{ email: opts.to }],
    });

    const messageId = result.messageId ?? result.messageIds?.[0] ?? 'not-returned';
    logger.info(
      `Email accepted by Brevo: recipient=${maskEmail(opts.to)} subject="${opts.subject}" messageId=${messageId}`
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    logger.error(
      `Brevo rejected email request: recipient=${maskEmail(opts.to)} subject="${opts.subject}" reason=${reason}`
    );
    throw new Error('Failed to send email', { cause: error });
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await sendEmail({
    to,
    subject: emailSubjects.passwordReset,
    html: emailTemplates.passwordReset(resetUrl),
  });
}

export async function sendEmailVerification(to: string, verifyUrl: string): Promise<void> {
  await sendEmail({
    to,
    subject: emailSubjects.emailVerification,
    html: emailTemplates.emailVerification(verifyUrl),
  });
}

export async function sendInvitationEmail(
  to: string,
  activationUrl: string,
  role: 'institution_admin' | 'instructor' | 'learner',
  institutionName: string
): Promise<void> {
  const roleLabel = {
    institution_admin: 'Institution Administrator',
    instructor: 'Instructor',
    learner: 'Learner',
  }[role];
  const safeInstitutionName = escapeHtml(institutionName);
  const safeActivationUrl = escapeHtml(activationUrl);

  await sendEmail({
    to,
    subject: `Your CogniSacra ${roleLabel} invitation`,
    html: `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>CogniSacra invitation</title></head>
<body style="margin:0;background:#f4f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">You have been invited to join ${safeInstitutionName} as a ${roleLabel}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 12px;"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border:1px solid #e5eaf2;border-radius:18px;overflow:hidden;">
      <tr><td style="background:#243b80;padding:30px 36px;"><div style="font-size:24px;font-weight:700;color:#fff;">Cogni<span style="color:#b9c7ff;">Sacra</span></div><div style="margin-top:8px;color:#dce4ff;font-size:13px;">Learning, connected intelligently.</div></td></tr>
      <tr><td style="padding:40px 36px 24px;"><div style="display:inline-block;background:#eef1ff;color:#3d56ad;border-radius:999px;padding:7px 13px;font-size:12px;font-weight:700;text-transform:uppercase;">Account invitation</div><h1 style="margin:20px 0 12px;color:#172033;font-size:30px;line-height:38px;">Welcome to CogniSacra</h1><p style="margin:0;color:#536174;font-size:16px;line-height:26px;">You have been invited to join <strong style="color:#172033;">${safeInstitutionName}</strong> as an <strong style="color:#3d56ad;">${roleLabel}</strong>.</p></td></tr>
      <tr><td style="padding:0 36px 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fd;border:1px solid #e7ebf4;border-radius:12px;"><tr><td style="padding:18px 20px;color:#68758a;font-size:13px;">Your role</td><td align="right" style="padding:18px 20px;color:#172033;font-size:14px;font-weight:700;">${roleLabel}</td></tr><tr><td colspan="2" style="border-top:1px solid #e7ebf4;"></td></tr><tr><td style="padding:18px 20px;color:#68758a;font-size:13px;">Institution</td><td align="right" style="padding:18px 20px;color:#172033;font-size:14px;font-weight:700;">${safeInstitutionName}</td></tr></table></td></tr>
      <tr><td align="center" style="padding:0 36px 28px;"><a href="${safeActivationUrl}" style="display:inline-block;background:#4059c4;border-radius:9px;color:#fff;font-size:16px;font-weight:700;line-height:24px;padding:14px 28px;text-decoration:none;">Activate your account</a></td></tr>
      <tr><td style="padding:0 36px 32px;"><p style="margin:0;color:#68758a;font-size:13px;text-align:center;">This invitation expires in <strong style="color:#3e4c65;">72 hours</strong> and can only be used once.</p><p style="margin:14px 0 0;color:#9aa5b5;font-size:12px;text-align:center;">If the button does not work, copy this link:</p><p style="margin:6px 0 0;word-break:break-all;text-align:center;"><a href="${safeActivationUrl}" style="color:#4059c4;font-size:12px;">${safeActivationUrl}</a></p></td></tr>
      <tr><td style="border-top:1px solid #edf0f5;padding:22px 36px;background:#fbfcfe;"><p style="margin:0;color:#9aa5b5;font-size:12px;text-align:center;">If you were not expecting this invitation, you can safely ignore this email.</p><p style="margin:8px 0 0;color:#b0b8c5;font-size:11px;text-align:center;">© ${new Date().getFullYear()} CogniSacra</p></td></tr>
    </table>
  </td></tr></table>
</body></html>`,
  });
}
