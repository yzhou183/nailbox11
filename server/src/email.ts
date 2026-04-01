import { Resend } from 'resend'

const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = process.env.FROM_EMAIL   || 'noreply@nailbox.com'
const TO_ADMIN = process.env.ADMIN_EMAIL || ''

interface BookingInfo {
  name:              string
  email:             string
  wechat?:           string
  date:              string
  timeSlot:          string
  basicServiceName:  string
  addonServices:     string[]
  notes?:            string
}

/** 客人自动回执 */
export async function sendCustomerReceipt(b: BookingInfo): Promise<void> {
  const addons = b.addonServices.length ? b.addonServices.join('、') : '无'

  await resend.emails.send({
    from: FROM,
    to:   b.email,
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

  <div style="background:#fff8fa;border:1px solid #ffd0dc;border-radius:12px;padding:20px 24px;margin:24px 0;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:2;">
      <tr><td style="color:#c090a0;width:90px;">日期</td><td style="color:#3d1230;">${b.date}</td></tr>
      <tr><td style="color:#c090a0;">时间</td><td style="color:#3d1230;">${b.timeSlot}</td></tr>
      <tr><td style="color:#c090a0;">基础服务</td><td style="color:#3d1230;">${b.basicServiceName}</td></tr>
      <tr><td style="color:#c090a0;">增值服务</td><td style="color:#3d1230;">${addons}</td></tr>
      ${b.notes ? `<tr><td style="color:#c090a0;">备注</td><td style="color:#3d1230;">${b.notes}</td></tr>` : ''}
    </table>
  </div>

  <p style="color:#9a4065;font-size:13px;line-height:1.8;">
    如有紧急情况，请添加微信：<strong style="color:#e8789a;">nailbox11</strong>
  </p>

  <hr style="border:none;border-top:1px solid #ffd0dc;margin:20px 0;">
  <p style="color:#c090a0;font-size:11px;text-align:center;margin:0;">
    888 S Hope St, Los Angeles, CA 90017
  </p>
</div>`,
  })
}

/** 通知管理员有新预约 */
export async function notifyAdmin(b: BookingInfo): Promise<void> {
  if (!TO_ADMIN) return
  const addons = b.addonServices.length ? b.addonServices.join('、') : '无'

  await resend.emails.send({
    from: FROM,
    to:   TO_ADMIN,
    subject: `新预约 — ${b.name} | ${b.date} ${b.timeSlot}`,
    html: `
<div style="font-family:sans-serif;max-width:500px;padding:24px;color:#3d1230;">
  <h2 style="margin-top:0;">新预约申请</h2>
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
  <p style="margin-top:24px;">
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin"
       style="background:#e8789a;color:#fff;padding:10px 24px;text-decoration:none;border-radius:20px;font-size:14px;">
      前往后台确认
    </a>
  </p>
</div>`,
  })
}
