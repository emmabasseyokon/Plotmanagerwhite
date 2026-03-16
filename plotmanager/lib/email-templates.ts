import { getThemeColor } from './theme'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function baseLayout(companyName: string, content: string): string {
  const brandColor = getThemeColor()
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background-color:${brandColor};padding:24px 32px;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${escapeHtml(companyName)}</h1>
      </div>
      <div style="padding:32px;">
        ${content}
      </div>
      <div style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
        <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
          Sent on behalf of ${escapeHtml(companyName)}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

export function paymentReminderHtml(params: {
  buyerFirstName: string
  companyName: string
  amountDue: string
  dueDate: string
  isOverdue: boolean
}): string {
  const { buyerFirstName, companyName, amountDue, dueDate, isOverdue } = params

  const statusColor = isOverdue ? '#dc2626' : '#f59e0b'
  const statusLabel = isOverdue ? 'OVERDUE' : 'UPCOMING'
  const statusMessage = isOverdue
    ? `Your payment of <strong>${escapeHtml(amountDue)}</strong> was due on <strong>${escapeHtml(dueDate)}</strong> and is now overdue.`
    : `You have an upcoming payment of <strong>${escapeHtml(amountDue)}</strong> due on <strong>${escapeHtml(dueDate)}</strong>.`

  const content = `
    <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
      Dear ${escapeHtml(buyerFirstName)},
    </p>
    <div style="background-color:${statusColor}10;border-left:4px solid ${statusColor};padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:${statusColor};font-size:13px;font-weight:700;letter-spacing:0.5px;">
        ${statusLabel}
      </p>
      <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
        ${statusMessage}
      </p>
    </div>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
      Please make your payment at your earliest convenience. If you have already made this payment, kindly disregard this reminder.
    </p>
    <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
      If you have any questions, please contact us directly.
    </p>
    <p style="margin:24px 0 0;color:#374151;font-size:15px;">
      Best regards,<br><strong>${escapeHtml(companyName)}</strong>
    </p>`

  return baseLayout(companyName, content)
}

export function broadcastEmailHtml(params: {
  buyerFirstName: string
  companyName: string
  subject: string
  messageBody: string
}): string {
  const { buyerFirstName, companyName, subject, messageBody } = params

  const formattedBody = escapeHtml(messageBody).replace(/\n/g, '<br>')

  const content = `
    <p style="margin:0 0 8px;color:#111827;font-size:18px;font-weight:600;">
      ${escapeHtml(subject)}
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
    <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
      Dear ${escapeHtml(buyerFirstName)},
    </p>
    <div style="color:#374151;font-size:15px;line-height:1.8;">
      ${formattedBody}
    </div>
    <p style="margin:24px 0 0;color:#374151;font-size:15px;">
      Best regards,<br><strong>${escapeHtml(companyName)}</strong>
    </p>`

  return baseLayout(companyName, content)
}
