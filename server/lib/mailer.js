// server/lib/mailer.js
//
// Outgoing mail, through any SMTP service. Configure ONE of:
//   SMTP_URL                      e.g. smtps://user:pass@smtp.example.com:465
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// MAIL_FROM, the address mail is sent as, is optional: without it, mail
// is sent as the SMTP account itself.
//
// MAIL_DRY_RUN=1 builds every message in full but sends nothing, for
// rehearsing the card flow without an inbox at the end of it. With
// MAIL_DRY_RUN_DIR set too, each message is written there as a .eml.

import nodemailer from 'nodemailer';

let _transport = null;

export function mailConfigured() {
  if (process.env.MAIL_DRY_RUN === '1') return true;
  const { SMTP_URL, SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  return !!SMTP_URL || (!!SMTP_HOST && !!SMTP_USER && !!SMTP_PASS);
}

// What is missing, said plainly, for the server log at startup. Never
// includes a value, only the names of the settings.
export function mailStatus() {
  if (process.env.MAIL_DRY_RUN === '1') return 'dry run: messages are built but not sent';
  const { SMTP_URL, SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_URL) {
    try {
      const u = new URL(SMTP_URL);
      if (!u.username || !u.password) return 'SMTP_URL is set but has no user or password in it';
      return `ready, through ${u.hostname}`;
    } catch {
      return 'SMTP_URL is set but is not a valid address (an @ in the user name must be written %40)';
    }
  }
  const missing = [['SMTP_HOST', SMTP_HOST], ['SMTP_USER', SMTP_USER], ['SMTP_PASS', SMTP_PASS]]
    .filter(([, v]) => !v).map(([k]) => k);
  return missing.length === 3 ? 'not connected: set SMTP_URL' : `not connected: missing ${missing.join(', ')}`;
}

// The sender: MAIL_FROM if set, otherwise the SMTP account's own address.
function sender() {
  if (process.env.MAIL_FROM) return process.env.MAIL_FROM;
  let user = process.env.SMTP_USER || '';
  try { if (process.env.SMTP_URL) user = decodeURIComponent(new URL(process.env.SMTP_URL).username); } catch { /* fall through */ }
  return user.includes('@') ? `Hearth <${user}>` : 'Hearth <no-reply@hearth.local>';
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
    from: sender(),
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
