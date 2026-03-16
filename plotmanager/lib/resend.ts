import { Resend } from 'resend'
import { APP_NAME } from './config'

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || '')
  }
  return _resend
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || `${APP_NAME} <onboarding@resend.dev>`
