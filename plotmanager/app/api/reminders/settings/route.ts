import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireSuperAdmin, validationError, serverError } from '@/lib/api-helpers'
import { z } from 'zod'
import type { TablesUpdate } from '@/types/database.types'

const settingsSchema = z.object({
  auto_reminders_enabled: z.boolean(),
  reminder_days_before: z.number().int().min(1).max(30),
})

export async function GET() {
  try {
    const result = await authenticateRequest()
    if (result.error) return result.error
    const { companyId, adminClient } = result.auth

    const { data: company } = await adminClient
      .from('companies')
      .select('auto_reminders_enabled, reminder_days_before')
      .eq('id', companyId)
      .single()

    return NextResponse.json({
      auto_reminders_enabled: company?.auto_reminders_enabled ?? false,
      reminder_days_before: company?.reminder_days_before ?? 3,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await authenticateRequest()
    if (result.error) return result.error
    const { auth } = result

    const forbidden = requireSuperAdmin(auth)
    if (forbidden) return forbidden

    const body = await request.json()
    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const updateData: TablesUpdate<'companies'> = {
      auto_reminders_enabled: parsed.data.auto_reminders_enabled,
      reminder_days_before: parsed.data.reminder_days_before,
    }

    const { error } = await auth.adminClient
      .from('companies')
      .update(updateData)
      .eq('id', auth.companyId)

    if (error) {
      return serverError(error, 'PUT /api/reminders/settings')
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
