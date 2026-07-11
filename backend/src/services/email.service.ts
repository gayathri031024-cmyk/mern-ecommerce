import nodemailer, { Transporter } from 'nodemailer';
import { env, isProduction } from '@config/env';
import { logger } from '@utils/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_USER || !env.SMTP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

async function sendMail(to: string, subject: string, html: string, textFallback: string): Promise<void> {
  const mailer = getTransporter();

  if (!mailer) {
    // No SMTP credentials configured - log instead of failing, so auth flows
    // remain testable in local/dev environments without a real mail provider.
    logger.warn(`SMTP not configured - logging email instead of sending to ${to}`);
    logger.info(`[EMAIL] To: ${to} | Subject: ${subject}\n${textFallback}`);
    return;
  }

  try {
    await mailer.sendMail({ from: env.EMAIL_FROM, to, subject, html, text: textFallback });
  } catch (error) {
    logger.error(`Failed to send email to ${to}`, error);
    if (isProduction) throw error;
  }
}

export async function sendVerificationEmail(to: string, name: string, rawToken: string): Promise<void> {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${rawToken}`;
  const subject = 'Verify your email address';
  const html = `<p>Hi ${name},</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`;
  const text = `Hi ${name}, verify your email: ${verifyUrl} (expires in 24 hours)`;
  await sendMail(to, subject, html, text);
}

export async function sendPasswordResetEmail(to: string, name: string, rawToken: string): Promise<void> {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
  const subject = 'Reset your password';
  const html = `<p>Hi ${name},</p><p>We received a request to reset your password. Click the link below to choose a new one:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>`;
  const text = `Hi ${name}, reset your password: ${resetUrl} (expires in 1 hour)`;
  await sendMail(to, subject, html, text);
}

interface OrderEmailItem {
  title: string;
  quantity: number;
  unitPrice: number;
}

export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  order: { orderNumber: string; total: number; items: OrderEmailItem[] },
): Promise<void> {
  const orderUrl = `${env.CLIENT_URL}/orders`;
  const subject = `Order confirmed: ${order.orderNumber}`;
  const itemsHtml = order.items
    .map((item) => `<li>${item.quantity} × ${item.title} — $${(item.quantity * item.unitPrice).toFixed(2)}</li>`)
    .join('');
  const html = `<p>Hi ${name},</p><p>Thanks for your order! We're getting it ready.</p><p><strong>Order ${order.orderNumber}</strong></p><ul>${itemsHtml}</ul><p><strong>Total: $${order.total.toFixed(2)}</strong></p><p><a href="${orderUrl}">View your orders</a></p>`;
  const text = `Hi ${name}, your order ${order.orderNumber} is confirmed. Total: $${order.total.toFixed(2)}. View it at ${orderUrl}`;
  await sendMail(to, subject, html, text);
}

export async function sendOrderStatusUpdateEmail(
  to: string,
  name: string,
  order: { orderNumber: string; status: string },
): Promise<void> {
  const orderUrl = `${env.CLIENT_URL}/orders`;
  const subject = `Order ${order.orderNumber} is now ${order.status}`;
  const html = `<p>Hi ${name},</p><p>Your order <strong>${order.orderNumber}</strong> status has been updated to <strong>${order.status}</strong>.</p><p><a href="${orderUrl}">View your orders</a></p>`;
  const text = `Hi ${name}, order ${order.orderNumber} is now ${order.status}. View it at ${orderUrl}`;
  await sendMail(to, subject, html, text);
}