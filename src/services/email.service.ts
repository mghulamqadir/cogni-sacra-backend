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

// ─── Core send ────────────────────────────────────────────────────────────────

async function sendEmail(opts: SendEmailOptions): Promise<void> {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      subject: opts.subject,
      htmlContent: opts.html,
      sender: {
        name: env.SENDER_NAME,
        email: env.SENDER_EMAIL,
      },
      to: [{ email: opts.to }],
    });

    logger.info(`Email sent to ${opts.to}: ${opts.subject}`);
  } catch (error) {
    logger.error(`Failed to send email to ${opts.to}:`, error);
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
