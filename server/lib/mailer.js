// server/lib/mailer.js
//
// Outgoing mail, through any SMTP service. Configure ONE of:
//   SMTP_URL                      e.g. smtps://user:pass@smtp.example.com:465
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// and MAIL_FROM, the address mail is sent as.
//
// MAIL_DRY_RUN=1 builds every message in full but sends nothing, for
// rehearsing the card flow without an inbox at the end of it. With
// MAIL_DRY_RUN_DIR set too, each message is written there as a .eml.

import nodemailer from 'nodemailer';

let _transport = null;

export function mailConfigured() {
  if (process.env.MAIL_DRY_RUN === '1') return true;
  const { SMTP_URL, SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
  return !!MAIL_FROM && (!!SMTP_URL || (!!SMTP_HOST && !!SMTP_USER && !!SMTP_PASS));
}

function transport() {
  if (_transport) return _transport;
  const env = process.env;
  if (env.MAIL_DRY_RUN === '1') {
    _transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  } else if (env.SMTP_URL) {
    _transport = nodemailer.createTransport(env.SMTP_URL);
  } else {
    const port = parseInt(env.SMTP_PORT, 10) || 465;
    _transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return _transport;
}

// Returns nodemailer's info object. In a dry run, info.message holds
// the full message as it would have been sent.
export async function sendMail({ to, subject, text, html, attachments = [], replyTo }) {
  if (!mailConfigured()) throw new Error('Mail is not configured on the server');
  const info = await transport().sendMail({
    from: process.env.MAIL_FROM || 'Hearth <no-reply@hearth.local>',
    to,
    subject,
    text,
    html,
    replyTo,
    attachments,
  });
  // A dry run can leave each message on disk to be opened and checked.
  if (process.env.MAIL_DRY_RUN === '1' && process.env.MAIL_DRY_RUN_DIR && info.message) {
    const fs = await import('fs');
    const path = await import('path');
    fs.writeFileSync(path.join(process.env.MAIL_DRY_RUN_DIR, `${Date.now()}.eml`), info.message);
  }
  return info;
}
