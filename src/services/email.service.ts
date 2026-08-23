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

export async function sendInvitationEmail(to: string, activationUrl: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Activate your CogniSacra account',
    html: `<p>You have been invited to CogniSacra.</p><p><a href="${activationUrl}">Choose your password and activate your account</a></p><p>This link expires in 72 hours.</p>`,
  });
}
