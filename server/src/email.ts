/**
 * @file email.ts
 * @description Transactional email helpers for the Nail Box booking system.
 *
 * This module wraps the Resend SDK and exposes two purpose-built functions:
 *
 *  1. `sendCustomerReceipt` — sends a branded HTML confirmation email to the
 *     guest immediately after they submit a booking request.
 *
 *  2. `notifyAdmin` — sends a plain summary email to the studio owner so they
 *     can review the new booking and act on it in the admin dashboard.
 *
 * Both functions are fire-and-forget from the caller's perspective: the booking
 * route sends them with .catch() so an email failure never blocks the HTTP response.
 *
 * Environment variables consumed:
 *  RESEND_API_KEY — API key from resend.com (required for delivery).
 *  FROM_EMAIL     — The "From" address shown to recipients (defaults to noreply@nailbox.com).
 *  ADMIN_EMAIL    — Studio owner's inbox; if empty, notifyAdmin() is a no-op.
 *  FRONTEND_URL   — Used to build the "Go to dashboard" link in the admin email.
 */

import { Resend } from 'resend'

// Instantiate the Resend client once at module load time.
// All send calls share this single instance (no need to recreate per request).
const resend  = new Resend(process.env.RESEND_API_KEY)

// Sender address displayed to email recipients.
// Using an environment variable allows different values in staging vs. production
// without changing code (e.g., staging@nailbox.com vs. noreply@nailbox.com).
const FROM    = process.env.FROM_EMAIL   || 'noreply@nailbox.com'

// Destination inbox for admin notifications.
// An empty string disables admin notifications — useful in dev/staging where
// real emails should not be sent to the owner.
const TO_ADMIN = process.env.ADMIN_EMAIL || ''

// ---------------------------------------------------------------------------
// Shared data shape
// ---------------------------------------------------------------------------

/**
 * All information about a booking needed to compose either email.
 * Both functions accept this same interface to keep the call site simple.
 */
interface BookingInfo {
  name:              string    // Guest's full name
  email:             string    // Guest's email address (destination for receipt)
  wechat?:           string    // Optional WeChat ID shown in the admin notification
  date:              string    // Appointment date as a display string (e.g. "2025-08-15")
  timeSlot:          string    // Selected time slot (e.g. "2:30 PM")
  basicServiceName:  string    // Human-readable name of the chosen base service
  addonServices:     string[]  // Array of human-readable add-on service names
  notes?:            string    // Optional free-text note from the guest
}

// ---------------------------------------------------------------------------
// Customer receipt
// ---------------------------------------------------------------------------

/**
 * Sends a branded HTML confirmation email to the guest.
 *
 * The email reassures the guest that their request was received and tells them
 * to expect a follow-up confirmation. It also summarizes the appointment details
 * and provides the studio's WeChat handle for urgent contact.
 *
 * The email is intentionally written in Chinese (Simplified) because the
 * studio's primary clientele is Chinese-speaking.
 *
 * @param b - Booking details to render into the email body.
 * @returns  A promise that resolves when Resend accepts the message for delivery.
 *           Note: resolution does not guarantee inbox delivery.
 */
export async function sendCustomerReceipt(b: BookingInfo): Promise<void> {
  // Build a readable add-on list; fall back to "无" (none) if none were selected.
  // Chinese enumeration separator "、" is used to match the locale of the email.
  const addons = b.addonServices.length ? b.addonServices.join('、') : '无'

  await resend.emails.send({
    from: FROM,
    to:   b.email,
    // Subject is in Chinese to match the email body and stand out in a Chinese inbox.
    subject: '已收到您的预约申请 — Nail Box',
    html: `
<div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;padding:40px 24px;color:#3d1230;background:#fff;">
  <h1 style="font-size:26px;font-weight:300;letter-spacing:6px;margin-bottom:4px;">Nail Box</h1>
  <p style="font-size:10px;letter-spacing:3px;color:#c090a0;text-transform:uppercase;margin-top:0;">精品美甲工作室 · Los Angeles</p>

  <hr style="border:none;border-top:1px solid #ffd0dc;margin:20px 0;">

  <h2 style="font-size:18px;font-weight:400;color:#3d1230;">预约申请已收到 ✦</h2>
  <p style="color:#9a4065;font-size:14px;line-height:1.9;">
    亲爱的 ${b.name}，您好！<br>
    我们已收到您的预约申请，将尽快与您确认，请稍候。
  </p>

  <!-- Booking detail card — soft pink background to distinguish from body text -->
  <div style="background:#fff8fa;border:1px solid #ffd0dc;border-radius:12px;padding:20px 24px;margin:24px 0;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:2;">
      <tr><td style="color:#c090a0;width:90px;">日期</td><td style="color:#3d1230;">${b.date}</td></tr>
      <tr><td style="color:#c090a0;">时间</td><td style="color:#3d1230;">${b.timeSlot}</td></tr>
      <tr><td style="color:#c090a0;">基础服务</td><td style="color:#3d1230;">${b.basicServiceName}</td></tr>
      <tr><td style="color:#c090a0;">增值服务</td><td style="color:#3d1230;">${addons}</td></tr>
      ${b.notes ? `<tr><td style="color:#c090a0;">备注</td><td style="color:#3d1230;">${b.notes}</td></tr>` : ''}
    </table>
  </div>

  <!-- Emergency contact note — WeChat is the preferred channel for Chinese customers -->
  <p style="color:#9a4065;font-size:13px;line-height:1.8;">
    如有紧急情况，请添加微信：<strong style="color:#e8789a;">nailbox11</strong>
  </p>

  <hr style="border:none;border-top:1px solid #ffd0dc;margin:20px 0;">
  <!-- Physical address footer for the Los Angeles studio location -->
  <p style="color:#c090a0;font-size:11px;text-align:center;margin:0;">
    888 S Hope St, Los Angeles, CA 90017
  </p>
</div>`,
  })
}

// ---------------------------------------------------------------------------
// Admin notification
// ---------------------------------------------------------------------------

/**
 * Sends a concise new-booking notification to the studio owner's inbox.
 *
 * Unlike the customer receipt, this email is utilitarian: it contains all
 * fields the admin needs at a glance (including the guest's WeChat, which the
 * customer receipt does not display) and a direct link to the admin dashboard.
 *
 * This function is a no-op if ADMIN_EMAIL is not configured, making it safe
 * to call in development environments where the owner's inbox should not receive
 * test bookings.
 *
 * @param b - Booking details to render into the admin notification.
 * @returns  A promise that resolves when the message is accepted by Resend,
 *           or immediately if ADMIN_EMAIL is unset.
 */
export async function notifyAdmin(b: BookingInfo): Promise<void> {
  // Guard: skip silently if no admin address is configured.
  // This prevents accidental emails during local development and staging.
  if (!TO_ADMIN) return

  // Build add-on summary the same way as the customer receipt.
  const addons = b.addonServices.length ? b.addonServices.join('、') : '无'

  await resend.emails.send({
    from: FROM,
    to:   TO_ADMIN,
    // Subject includes guest name + date/time so the admin can act without opening the email.
    subject: `新预约 — ${b.name} | ${b.date} ${b.timeSlot}`,
    html: `
<div style="font-family:sans-serif;max-width:500px;padding:24px;color:#3d1230;">
  <h2 style="margin-top:0;">新预约申请</h2>
  <!-- Full booking details in a compact table; every field is shown including WeChat -->
  <table style="border-collapse:collapse;width:100%;font-size:14px;">
    <tr><td style="padding:8px 0;border-bottom:1px solid #fce8ed;color:#999;width:90px;">姓名</td><td style="padding:8px 0;border-bottom:1px solid #fce8ed;">${b.name}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #fce8ed;color:#999;">邮箱</td><td style="padding:8px 0;border-bottom:1px solid #fce8ed;">${b.email}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #fce8ed;color:#999;">微信</td><td style="padding:8px 0;border-bottom:1px solid #fce8ed;">${b.wechat || '未填写'}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #fce8ed;color:#999;">日期</td><td style="padding:8px 0;border-bottom:1px solid #fce8ed;">${b.date}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #fce8ed;color:#999;">时间</td><td style="padding:8px 0;border-bottom:1px solid #fce8ed;">${b.timeSlot}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #fce8ed;color:#999;">服务</td><td style="padding:8px 0;border-bottom:1px solid #fce8ed;">${b.basicServiceName}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #fce8ed;color:#999;">增值</td><td style="padding:8px 0;border-bottom:1px solid #fce8ed;">${addons}</td></tr>
    ${b.notes ? `<tr><td style="padding:8px 0;color:#999;">备注</td><td style="padding:8px 0;">${b.notes}</td></tr>` : ''}
  </table>
  <!-- CTA button linking directly to the admin page so the owner can confirm/reject
       in one click without navigating to the site manually. -->
  <p style="margin-top:24px;">
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin"
       style="background:#e8789a;color:#fff;padding:10px 24px;text-decoration:none;border-radius:20px;font-size:14px;">
      前往后台确认
    </a>
  </p>
</div>`,
  })
}
